import asyncio
import uuid
from typing import Dict, Optional, Tuple


class MatchmakingService:
    """
    In-memory matchmaking queue with ELO-based matching.
    For production, use Redis for persistence across multiple workers.
    """

    def __init__(self):
        # {user_id: {"queue_id": str, "rating": int, "matched_duel_id": str|None}}
        self._queue: Dict[str, dict] = {}
        self._lock = asyncio.Lock()

    async def join_queue(
        self, user_id: str, rating: int
    ) -> Tuple[str, Optional[str], Optional[str]]:
        """
        Add a user to the matchmaking queue.
        Returns (queue_id, duel_id, opponent_id).
        duel_id is None if no match was found yet.
        """
        async with self._lock:
            queue_id = str(uuid.uuid4())

            # Try to find a match within 200 ELO
            best_match = None
            best_diff = float("inf")

            for uid, entry in self._queue.items():
                if uid == user_id:
                    continue
                if entry.get("matched_duel_id"):
                    continue  # already matched
                diff = abs(entry["rating"] - rating)
                if diff <= 200 and diff < best_diff:
                    best_match = uid
                    best_diff = diff

            if best_match:
                duel_id = str(uuid.uuid4())
                opponent_entry = self._queue.pop(best_match)

                # Mark the match
                return queue_id, duel_id, best_match
            else:
                # Add to queue
                self._queue[user_id] = {
                    "queue_id": queue_id,
                    "rating": rating,
                    "matched_duel_id": None,
                }
                return queue_id, None, None

    async def check_match(self, queue_id: str) -> Optional[str]:
        """Poll for match status by queue_id."""
        async with self._lock:
            for uid, entry in self._queue.items():
                if entry.get("queue_id") == queue_id:
                    return entry.get("matched_duel_id")
        return None

    async def leave_queue(self, user_id: str):
        """Remove a user from the queue."""
        async with self._lock:
            self._queue.pop(user_id, None)

    async def get_queue_size(self) -> int:
        async with self._lock:
            return len(self._queue)


matchmaking_service = MatchmakingService()
