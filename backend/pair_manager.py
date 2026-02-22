"""
PairRoomManager – In-memory room state for real-time pair programming.
Each room stores participants, shared code, language, chat, and WebSocket connections.
"""
from __future__ import annotations
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from fastapi import WebSocket
import json, asyncio, uuid, random, string


class PairRoomManager:
    """Manages all active pair-programming rooms."""

    def __init__(self):
        self.rooms: Dict[str, dict] = {}

    # ── helpers ──────────────────────────────────────────
    @staticmethod
    def _make_code() -> str:
        return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    # ── room lifecycle ───────────────────────────────────
    def create_room(self, creator_id: str, creator_name: str) -> dict:
        room_id = str(uuid.uuid4())[:8]
        join_code = self._make_code()
        room = {
            "room_id": room_id,
            "join_code": join_code,
            "created_at": self._now(),
            "participants": [
                {"user_id": creator_id, "username": creator_name, "role": "driver"}
            ],
            "code": "",
            "language": "python",
            "problem_id": None,
            "problem": None,
            "chat": [],
            "status": "waiting",       # waiting | active | closed
            "_websockets": [],          # live WS connections (not serialised)
        }
        self.rooms[room_id] = room
        return self._public(room)

    def join_room(self, room_id: str, user_id: str, username: str) -> dict:
        room = self.rooms.get(room_id)
        if not room:
            # Try searching by join_code
            for r in self.rooms.values():
                if r["join_code"] == room_id:
                    room = r
                    break
        if not room:
            raise ValueError("Room not found")
        if room["status"] == "closed":
            raise ValueError("Room is closed")
        if any(p["user_id"] == user_id for p in room["participants"]):
            return self._public(room)          # already in room
        if len(room["participants"]) >= 2:
            raise ValueError("Room is full")
        room["participants"].append(
            {"user_id": user_id, "username": username, "role": "navigator"}
        )
        room["status"] = "active"
        return self._public(room)

    def leave_room(self, room_id: str, user_id: str):
        room = self.rooms.get(room_id)
        if not room:
            return
        room["participants"] = [
            p for p in room["participants"] if p["user_id"] != user_id
        ]
        if not room["participants"]:
            room["status"] = "closed"

    def get_room(self, room_id: str) -> Optional[dict]:
        room = self.rooms.get(room_id)
        return self._public(room) if room else None

    # ── code sync ────────────────────────────────────────
    def update_code(self, room_id: str, code: str, language: str | None = None):
        room = self.rooms.get(room_id)
        if room:
            room["code"] = code
            if language:
                room["language"] = language

    def set_problem(self, room_id: str, problem_id: str, problem: dict):
        room = self.rooms.get(room_id)
        if room:
            room["problem_id"] = problem_id
            room["problem"] = problem

    # ── chat ─────────────────────────────────────────────
    def add_message(self, room_id: str, user_id: str, username: str, text: str) -> dict:
        msg = {
            "id": str(uuid.uuid4())[:8],
            "user_id": user_id,
            "username": username,
            "text": text,
            "timestamp": self._now(),
        }
        room = self.rooms.get(room_id)
        if room:
            room["chat"].append(msg)
            # Keep last 200 messages
            if len(room["chat"]) > 200:
                room["chat"] = room["chat"][-200:]
        return msg

    # ── websocket tracking ───────────────────────────────
    def add_ws(self, room_id: str, ws: WebSocket):
        room = self.rooms.get(room_id)
        if room and ws not in room["_websockets"]:
            room["_websockets"].append(ws)

    def remove_ws(self, room_id: str, ws: WebSocket):
        room = self.rooms.get(room_id)
        if room and ws in room["_websockets"]:
            room["_websockets"].remove(ws)

    async def broadcast(self, room_id: str, message: dict, exclude: WebSocket | None = None):
        room = self.rooms.get(room_id)
        if not room:
            return
        payload = json.dumps(message)
        dead: list[WebSocket] = []
        for ws in room["_websockets"]:
            if ws is exclude:
                continue
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            room["_websockets"].remove(ws)

    # ── serialisation (strip internals) ──────────────────
    @staticmethod
    def _public(room: dict) -> dict:
        return {k: v for k, v in room.items() if not k.startswith("_")}
