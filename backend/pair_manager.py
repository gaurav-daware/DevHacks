import json
import logging
import time
import asyncio
from typing import Dict, List, Optional, Any
from fastapi import WebSocket, status

logger = logging.getLogger(__name__)

class PairRoomManager:
    def __init__(self):
        # { roomId: { "users": { clientId: { "username": str, "ws": ws, "role": str, "joined_at": float } }, "code": str, "chat": [] } }
        self.rooms: Dict[str, dict] = {}
        self._lock: Optional[asyncio.Lock] = None

    def _get_lock(self):
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    async def connect(self, ws: WebSocket, room_id: str, username: str, client_id: str):
        await ws.accept()
        
        async with self._get_lock():
            if room_id not in self.rooms:
                self.rooms[room_id] = {
                    "users": {},
                    "code": "class Solution:\n    def solve(self):\n        pass",
                    "chat": [],
                    "last_updated": time.time()
                }
            
            room = self.rooms[room_id]
            
            # 1. Enforce Max 2 Connections per room
            if len(room["users"]) >= 2 and client_id not in room["users"]:
                await ws.send_json({
                    "type": "error", 
                    "data": {"code": "ROOM_FULL", "message": "This collaborative session is already full (max 2 users)."}
                })
                await ws.close(code=status.WS_1008_POLICY_VIOLATION)
                return None

            # 2. Assign Role (First Connection is Driver)
            role = "Driver" if not any(u["role"] == "Driver" for u in room["users"].values()) else "Navigator"
            
            room["users"][client_id] = {
                "clientId": client_id,
                "username": username,
                "role": role,
                "ws": ws,
                "joined_at": time.time()
            }
            room["last_updated"] = time.time()

        # 3. Send Initial Room State to the joiner
        await ws.send_json({
            "type": "room_state",
            "data": {
                "roomId": room_id,
                "myClientId": client_id,
                "role": role,
                "code": room["code"],
                "participants": self._get_participants(room_id),
                "chat_history": room["chat"]
            }
        })

        # 4. Broadcast updated presence to EVERYONE in the room
        await self.broadcast(room_id, {
            "type": "presence_update",
            "data": {
                "participants": self._get_participants(room_id)
            }
        })

        logger.info(f"User {username} [{client_id}] ({role}) joined room {room_id}")
        return client_id

    async def handle_message(self, room_id: str, client_id: str, message: dict):
        if room_id not in self.rooms: return
        
        room = self.rooms[room_id]
        msg_type = message.get("type")
        data = message.get("data", {})

        if msg_type == "heartbeat":
            if client_id in room["users"]:
                await room["users"][client_id]["ws"].send_json({"type": "heartbeat_pong"})
        
        elif msg_type == "editor_sync":
            room["code"] = data.get("code", "")
            await self.broadcast(room_id, {
                "type": "editor_sync",
                "data": {"code": room["code"]}
            }, skip_client_id=client_id)

        elif msg_type == "chat_message":
            chat_entry = {
                "clientId": client_id,
                "username": room["users"][client_id]["username"],
                "text": data.get("text", ""),
                "ts": time.time()
            }
            room["chat"].append(chat_entry)
            if len(room["chat"]) > 50: room["chat"].pop(0)
            
            await self.broadcast(room_id, {
                "type": "chat_message",
                "data": chat_entry
            })

        elif msg_type == "request_role_switch":
            async with self._get_lock():
                # Swap roles between all users
                for cid in room["users"]:
                    room["users"][cid]["role"] = "Navigator" if room["users"][cid]["role"] == "Driver" else "Driver"
                
                await self.broadcast(room_id, {
                    "type": "role_updated",
                    "data": {"participants": self._get_participants(room_id)}
                })

        elif msg_type == "webrtc_signal":
            await self.broadcast(room_id, {
                "type": "webrtc_signal",
                "data": data,
                "from": client_id
            }, skip_client_id=client_id)

        room["last_updated"] = time.time()

    async def disconnect(self, room_id: str, client_id: str):
        async with self._get_lock():
            if room_id in self.rooms:
                room = self.rooms[room_id]
                if client_id in room["users"]:
                    del room["users"][client_id]
                    
                    if not room["users"]:
                        del self.rooms[room_id]
                    else:
                        # Auto-promote remaining user to Driver if no driver exists
                        if not any(u["role"] == "Driver" for u in room["users"].values()):
                            remaining_cid = list(room["users"].keys())[0]
                            room["users"][remaining_cid]["role"] = "Driver"
                        
                        await self.broadcast(room_id, {
                            "type": "presence_update",
                            "data": {
                                "participants": self._get_participants(room_id)
                            }
                        })
                    logger.info(f"ClientId {client_id} disconnected from {room_id}")

    async def broadcast(self, room_id: str, message: dict, skip_client_id: Optional[str] = None):
        if room_id not in self.rooms: return
        room = self.rooms[room_id]
        
        dead_cids = []
        # Create a copy of keys to avoid modification during iteration
        for cid in list(room["users"].keys()):
            if cid != skip_client_id:
                try:
                    await room["users"][cid]["ws"].send_json(message)
                except Exception:
                    dead_cids.append(cid)
        
        for cid in dead_cids:
            await self.disconnect(room_id, cid)

    def _get_participants(self, room_id: str) -> List[dict]:
        if room_id not in self.rooms: return []
        return [
            {"clientId": u["clientId"], "username": u["username"], "role": u["role"]}
            for u in self.rooms[room_id]["users"].values()
        ]

pair_manager = PairRoomManager()
