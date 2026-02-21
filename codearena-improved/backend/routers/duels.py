import asyncio
import json
import uuid
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from schemas.models import QueueRequest, QueueResponse
from services.matchmaking import matchmaking_service

router = APIRouter()

# Active WebSocket connections: duel_id -> {user_id: WebSocket}
active_connections: Dict[str, Dict[str, WebSocket]] = {}


class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, duel_id: str, user_id: str):
        await websocket.accept()
        if duel_id not in self.connections:
            self.connections[duel_id] = {}
        self.connections[duel_id][user_id] = websocket

    def disconnect(self, duel_id: str, user_id: str):
        if duel_id in self.connections:
            self.connections[duel_id].pop(user_id, None)
            if not self.connections[duel_id]:
                del self.connections[duel_id]

    async def broadcast(self, duel_id: str, message: dict, exclude_user: str = None):
        """Send message to all players in a duel."""
        if duel_id not in self.connections:
            return
        dead = []
        for uid, ws in self.connections[duel_id].items():
            if uid == exclude_user:
                continue
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(uid)
        for uid in dead:
            self.disconnect(duel_id, uid)

    async def send_to(self, duel_id: str, user_id: str, message: dict):
        """Send message to a specific user in a duel."""
        if duel_id in self.connections and user_id in self.connections[duel_id]:
            try:
                await self.connections[duel_id][user_id].send_text(json.dumps(message))
            except Exception:
                self.disconnect(duel_id, user_id)


manager = ConnectionManager()


@router.websocket("/ws/{duel_id}")
async def duel_websocket(websocket: WebSocket, duel_id: str):
    """
    WebSocket endpoint for real-time duel communication.
    
    Message types:
    - join: User identifies themselves
    - code_update: Code length changed (typing activity)
    - submission: Test results from a submission attempt
    - ping: Keep alive
    """
    user_id = websocket.query_params.get("user_id", "anonymous")
    await manager.connect(websocket, duel_id, user_id)

    try:
        # Notify others that a player connected
        await manager.broadcast(duel_id, {
            "type": "player_connected",
            "user_id": user_id,
        }, exclude_user=user_id)

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

            elif msg_type == "code_update":
                # Broadcast typing activity to opponent (not the sender)
                await manager.broadcast(duel_id, {
                    "type": "opponent_typing",
                    "user_id": user_id,
                    "code_length": message.get("code_length", 0),
                }, exclude_user=user_id)

            elif msg_type == "submission":
                # Broadcast submission result to opponent
                progress = message.get("progress", 0)
                tests_passed = message.get("tests_passed", 0)
                total_tests = message.get("total_tests", 0)

                await manager.broadcast(duel_id, {
                    "type": "progress_update",
                    "user_id": user_id,
                    "progress": progress,
                    "tests_passed": tests_passed,
                    "total_tests": total_tests,
                    "status": message.get("status", "CODING"),
                }, exclude_user=user_id)

                # Check win condition
                if progress >= 100:
                    await manager.broadcast(duel_id, {
                        "type": "duel_finished",
                        "winner_id": user_id,
                        "my_elo_delta": -20,
                    }, exclude_user=user_id)
                    await manager.send_to(duel_id, user_id, {
                        "type": "duel_finished",
                        "winner_id": user_id,
                        "my_elo_delta": 20,
                    })

            elif msg_type == "cursor":
                # Share cursor position for PairLab
                await manager.broadcast(duel_id, {
                    "type": "cursor_update",
                    "user_id": user_id,
                    "line": message.get("line"),
                    "column": message.get("column"),
                }, exclude_user=user_id)

    except WebSocketDisconnect:
        manager.disconnect(duel_id, user_id)
        await manager.broadcast(duel_id, {
            "type": "player_disconnected",
            "user_id": user_id,
        })
    except Exception as e:
        manager.disconnect(duel_id, user_id)


@router.post("/queue", response_model=dict)
async def join_queue(req: QueueRequest):
    """Join the matchmaking queue."""
    queue_id, duel_id, opponent_id = await matchmaking_service.join_queue(
        user_id=req.user_id,
        rating=req.rating,
    )

    if duel_id:
        return {
            "status": "matched",
            "duel_id": duel_id,
            "opponent_id": opponent_id,
        }

    return {
        "status": "queued",
        "queue_id": queue_id,
        "position": await matchmaking_service.get_queue_size(),
    }


@router.delete("/queue/{user_id}")
async def leave_queue(user_id: str):
    """Leave the matchmaking queue."""
    await matchmaking_service.leave_queue(user_id)
    return {"status": "left_queue"}


@router.get("/queue/status/{queue_id}")
async def check_queue_status(queue_id: str):
    """Poll for match status."""
    duel_id = await matchmaking_service.check_match(queue_id)
    if duel_id:
        return {"status": "matched", "duel_id": duel_id}
    return {"status": "waiting"}
