import json
import logging
from typing import Dict, List, Optional
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class PairRoomManager:
    def __init__(self):
        # { roomId: { "participants": { sid: { "username": str, "ws": ws, "role": str } }, "code": str } }
        self.rooms: Dict[str, dict] = {}

    async def connect(self, ws: WebSocket, room_id: str, username: str):
        await ws.accept()
        
        if room_id not in self.rooms:
            self.rooms[room_id] = {
                "participants": {},
                "code": "class Solution:\n    def solve(self):\n        pass"
            }
        
        room = self.rooms[room_id]
        
        # Enforce 2-user limit
        if len(room["participants"]) >= 2:
            await ws.send_json({"type": "error", "message": "Room is full (max 2 users)"})
            await ws.close()
            return None

        # Assign role: first user is Driver, second is Navigator
        role = "Driver" if not room["participants"] else "Navigator"
        sid = f"user_{id(ws)}"
        
        room["participants"][sid] = {
            "username": username,
            "ws": ws,
            "role": role,
            "sid": sid
        }

        # Send initial room state to the new user
        await ws.send_json({
            "type": "room_state",
            "data": {
                "roomId": room_id,
                "mySid": sid,
                "role": role,
                "code": room["code"],
                "participants": self._get_participants(room_id)
            }
        })

        # Broadcast join to others
        await self.broadcast(room_id, {
            "type": "presence_update",
            "data": {
                "action": "join",
                "user": {"sid": sid, "username": username, "role": role},
                "participants": self._get_participants(room_id)
            }
        }, skip_sid=sid)

        return sid

    def disconnect(self, room_id: str, sid: str):
        if room_id in self.rooms:
            room = self.rooms[room_id]
            if sid in room["participants"]:
                del room["participants"][sid]
                
                # Cleanup if room empty
                if not room["participants"]:
                    del self.rooms[room_id]
                else:
                    # If driver left, promote the other user
                    remaining_sid = list(room["participants"].keys())[0]
                    room["participants"][remaining_sid]["role"] = "Driver"
                    
            logger.info(f"User {sid} disconnected from room {room_id}")

    async def broadcast(self, room_id: str, message: dict, skip_sid: Optional[str] = None):
        if room_id in self.rooms:
            room = self.rooms[room_id]
            for sid, p in room["participants"].items():
                if sid != skip_sid:
                    try:
                        await p["ws"].send_json(message)
                    except Exception as e:
                        logger.error(f"Broadcast error to {sid}: {e}")

    async def handle_message(self, room_id: str, sid: str, message: dict):
        if room_id not in self.rooms:
            return

        msg_type = message.get("type")
        data = message.get("data", {})
        room = self.rooms[room_id]

        if msg_type == "edit":
            # Only driver should edit, but we trust for MVP; sync anyway
            room["code"] = data.get("code", "")
            await self.broadcast(room_id, {
                "type": "edit",
                "data": {"code": room["code"]}
            }, skip_sid=sid)

        elif msg_type == "request_role_switch":
            # Swap roles between the 2 participants
            sids = list(room["participants"].keys())
            if len(sids) == 2:
                for s in sids:
                    room["participants"][s]["role"] = "Navigator" if room["participants"][s]["role"] == "Driver" else "Driver"
                
                await self.broadcast(room_id, {
                    "type": "role_update",
                    "data": {
                        "participants": self._get_participants(room_id)
                    }
                })

        elif msg_type in ["webrtc_offer", "webrtc_answer", "webrtc_ice"]:
            # Relay signaling messages
            await self.broadcast(room_id, {
                "type": msg_type,
                "data": data,
                "from": sid
            }, skip_sid=sid)

    def _get_participants(self, room_id: str) -> List[dict]:
        return [
            {"sid": p["sid"], "username": p["username"], "role": p["role"]}
            for p in self.rooms[room_id]["participants"].values()
        ]

pair_manager = PairRoomManager()
