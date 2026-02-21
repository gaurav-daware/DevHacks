from flask import Blueprint, request, jsonify
from flask_socketio import emit, join_room, leave_room, disconnect
import json
from typing import Dict
from services.matchmaking import matchmaking_service
import asyncio

bp = Blueprint("duels", __name__, url_prefix="/duels")


class ConnectionManager:
    """Manage WebSocket connections for duels."""
    def __init__(self):
        self.connections: Dict[str, Dict[str, str]] = {}  # duel_id -> {user_id: sid}
    
    def connect(self, duel_id: str, user_id: str, sid: str):
        if duel_id not in self.connections:
            self.connections[duel_id] = {}
        self.connections[duel_id][user_id] = sid
    
    def disconnect(self, duel_id: str, user_id: str):
        if duel_id in self.connections:
            self.connections[duel_id].pop(user_id, None)
            if not self.connections[duel_id]:
                del self.connections[duel_id]
    
    def get_connected_users(self, duel_id: str) -> list:
        return list(self.connections.get(duel_id, {}).keys())
    
    def get_sid(self, duel_id: str, user_id: str) -> str:
        return self.connections.get(duel_id, {}).get(user_id)


manager = ConnectionManager()


def _run_async(coro):
    """Run async function in synchronous context."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


# HTTP Endpoints

@bp.route("/queue", methods=["POST"])
def join_queue():
    """Join the matchmaking queue."""
    data = request.get_json()
    user_id = data.get("user_id")
    rating = data.get("rating", 1600)
    
    if not user_id:
        return jsonify({"error": "user_id required"}), 400
    
    try:
        queue_id, duel_id, opponent_id = _run_async(
            matchmaking_service.join_queue(user_id=user_id, rating=rating)
        )
        
        if duel_id:
            return jsonify({
                "status": "matched",
                "duel_id": duel_id,
                "opponent_id": opponent_id,
            }), 200
        
        return jsonify({
            "status": "queued",
            "queue_id": queue_id,
            "position": _run_async(matchmaking_service.get_queue_size()),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/queue/<user_id>", methods=["DELETE"])
def leave_queue(user_id: str):
    """Leave the matchmaking queue."""
    try:
        _run_async(matchmaking_service.leave_queue(user_id))
        return jsonify({"status": "left_queue"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/queue/status/<queue_id>", methods=["GET"])
def check_queue_status(queue_id: str):
    """Poll for match status."""
    try:
        duel_id = _run_async(matchmaking_service.check_match(queue_id))
        if duel_id:
            return jsonify({"status": "matched", "duel_id": duel_id}), 200
        return jsonify({"status": "waiting"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# WebSocket Handlers

def register_socketio(app, socketio):
    """Register WebSocket event handlers."""
    
    @socketio.on("connect")
    def handle_connect():
        print(f"[WEBSOCKET] Client connected: {request.sid}")
    
    @socketio.on("disconnect")
    def handle_disconnect():
        print(f"[WEBSOCKET] Client disconnected: {request.sid}")
    
    @socketio.on("join_duel")
    def handle_join_duel(data):
        """User joins a duel room."""
        duel_id = data.get("duel_id")
        user_id = data.get("user_id")
        
        if not duel_id or not user_id:
            emit("error", {"message": "duel_id and user_id required"})
            return
        
        join_room(f"duel_{duel_id}")
        manager.connect(duel_id, user_id, request.sid)
        
        # Notify other player
        emit("player_connected", {
            "type": "player_connected",
            "user_id": user_id,
        }, room=f"duel_{duel_id}", skip_sid=request.sid)
        
        print(f"[WEBSOCKET] User {user_id} joined duel {duel_id}")
    
    @socketio.on("ping")
    def handle_ping(data):
        """Handle keep-alive ping."""
        emit("pong", {})
    
    @socketio.on("code_update")
    def handle_code_update(data):
        """Broadcast code typing activity."""
        duel_id = data.get("duel_id")
        user_id = data.get("user_id")
        code_length = data.get("code_length", 0)
        
        if duel_id:
            emit("opponent_typing", {
                "type": "opponent_typing",
                "user_id": user_id,
                "code_length": code_length,
            }, room=f"duel_{duel_id}", skip_sid=request.sid)
    
    @socketio.on("submission")
    def handle_submission(data):
        """Handle code submission."""
        duel_id = data.get("duel_id")
        user_id = data.get("user_id")
        progress = data.get("progress", 0)
        tests_passed = data.get("tests_passed", 0)
        total_tests = data.get("total_tests", 0)
        status = data.get("status", "CODING")
        
        if duel_id:
            # Broadcast to opponent
            emit("progress_update", {
                "type": "progress_update",
                "user_id": user_id,
                "progress": progress,
                "tests_passed": tests_passed,
                "total_tests": total_tests,
                "status": status,
            }, room=f"duel_{duel_id}", skip_sid=request.sid)
            
            # Check win condition
            if progress >= 100:
                # Opponent lost
                emit("duel_finished", {
                    "type": "duel_finished",
                    "winner_id": user_id,
                    "my_elo_delta": -20,
                }, room=f"duel_{duel_id}", skip_sid=request.sid)
                
                # Current user won
                emit("duel_finished", {
                    "type": "duel_finished",
                    "winner_id": user_id,
                    "my_elo_delta": 20,
                }, to=request.sid)
    
    @socketio.on("cursor")
    def handle_cursor(data):
        """Share cursor position for PairLab."""
        duel_id = data.get("duel_id")
        user_id = data.get("user_id")
        line = data.get("line")
        column = data.get("column")
        
        if duel_id:
            emit("cursor_update", {
                "type": "cursor_update",
                "user_id": user_id,
                "line": line,
                "column": column,
            }, room=f"duel_{duel_id}", skip_sid=request.sid)
    
    @socketio.on("code_sync")
    def handle_code_sync(data):
        """Sync code for pair programming."""
        duel_id = data.get("duel_id")
        user_id = data.get("user_id")
        code = data.get("code")
        language = data.get("language")
        
        if duel_id:
            emit("code_sync", {
                "type": "code_sync",
                "user_id": user_id,
                "code": code,
                "language": language,
            }, room=f"duel_{duel_id}", skip_sid=request.sid)
    
    @socketio.on("language_sync")
    def handle_language_sync(data):
        """Sync language change."""
        duel_id = data.get("duel_id")
        user_id = data.get("user_id")
        language = data.get("language")
        
        if duel_id:
            emit("language_sync", {
                "type": "language_sync",
                "user_id": user_id,
                "language": language,
            }, room=f"duel_{duel_id}", skip_sid=request.sid)
    
    @socketio.on_error()
    def error_handler(e):
        print(f"[WEBSOCKET] Error: {e}")

