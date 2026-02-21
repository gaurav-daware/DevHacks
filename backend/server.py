"""
CodeArena - AI-Assisted Competitive Programming Platform
Backend: FastAPI + MongoDB + WebSocket + Gemini AI
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import logging
import uuid
import random
import string
import subprocess
import sys
import asyncio
import time
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ───────────────────────────────────────────────
# DATABASE
# ───────────────────────────────────────────────
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ───────────────────────────────────────────────
# CONFIG
# ───────────────────────────────────────────────
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-fallback-secret')
JWT_ALGORITHM = "HS256"
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ───────────────────────────────────────────────
# SECURITY
# ───────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
optional_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# ───────────────────────────────────────────────
# FASTAPI APP
# ───────────────────────────────────────────────
app = FastAPI(title="CodeArena API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# ───────────────────────────────────────────────
# WEBSOCKET MANAGER
# ───────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, ws: WebSocket, room: str):
        await ws.accept()
        self.rooms.setdefault(room, []).append(ws)

    def disconnect(self, ws: WebSocket, room: str):
        if room in self.rooms:
            try:
                self.rooms[room].remove(ws)
            except ValueError:
                pass

    async def broadcast(self, room: str, data: dict):
        if room not in self.rooms:
            return
        dead = []
        for ws in self.rooms[room]:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            try:
                self.rooms[room].remove(ws)
            except ValueError:
                pass

manager = ConnectionManager()

# ───────────────────────────────────────────────
# PYDANTIC MODELS
# ───────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TestCase(BaseModel):
    input: str
    output: str

class ProblemCreate(BaseModel):
    title: str
    description: str
    difficulty: str  # easy | medium | hard
    tags: List[str] = []
    sample_input: str
    sample_output: str
    test_cases: List[TestCase] = []
    hints: List[str] = []
    constraints: str = ""
    time_limit: int = 5

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    tags: Optional[List[str]] = None
    sample_input: Optional[str] = None
    sample_output: Optional[str] = None
    test_cases: Optional[List[TestCase]] = None
    hints: Optional[List[str]] = None
    constraints: Optional[str] = None
    time_limit: Optional[int] = None

class ContestCreate(BaseModel):
    title: str
    description: str = ""
    problem_ids: List[str]
    duration: int  # minutes

class JoinContestRequest(BaseModel):
    join_code: str

class Keystroke(BaseModel):
    timestamp: float
    value: str

class SubmitCodeRequest(BaseModel):
    language: str
    code: str
    problem_id: str
    contest_id: Optional[str] = None
    keystrokes: Optional[List[Keystroke]] = []

class HintRequest(BaseModel):
    problem_id: str
    code: str = ""
    hint_level: int = 1

# ───────────────────────────────────────────────
# AUTH UTILITIES
# ───────────────────────────────────────────────

def hash_password(pwd: str) -> str:
    return pwd_context.hash(pwd)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: str, role: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=168)  # 7 days
    return jwt.encode({"sub": user_id, "role": role, "exp": exp}, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def get_optional_user(token: Optional[str] = Depends(optional_oauth2)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        return await db.users.find_one({"id": user_id}, {"_id": 0})
    except Exception:
        return None

def generate_join_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# ───────────────────────────────────────────────
# CODE EXECUTION ENGINE (Python real, C++/JS mock)
# ───────────────────────────────────────────────

async def execute_single(code: str, language: str, test_input: str, expected: str, time_limit: int = 5) -> dict:
    if language == "python":
        try:
            t0 = time.time()
            proc = subprocess.run(
                [sys.executable, "-c", code],
                input=test_input,
                capture_output=True,
                text=True,
                timeout=time_limit
            )
            elapsed = round(time.time() - t0, 3)
            actual = proc.stdout.strip()
            if proc.returncode != 0:
                return {"verdict": "Runtime Error", "output": proc.stderr[:500], "time": elapsed, "passed": False}
            if actual == expected.strip():
                return {"verdict": "Accepted", "output": actual, "time": elapsed, "passed": True}
            return {"verdict": "Wrong Answer", "output": actual, "expected": expected.strip(), "time": elapsed, "passed": False}
        except subprocess.TimeoutExpired:
            return {"verdict": "Time Limit Exceeded", "output": "", "time": time_limit, "passed": False}
        except Exception as e:
            return {"verdict": "Runtime Error", "output": str(e)[:200], "time": 0, "passed": False}
    else:
        # Mock execution for C++ and JavaScript
        await asyncio.sleep(0.05)
        return {"verdict": "Accepted", "output": expected.strip(), "time": 0.05, "passed": True, "note": f"Simulated ({language})"}

async def run_submission(code: str, language: str, test_cases: list, time_limit: int = 5) -> dict:
    if not test_cases:
        return {"verdict": "Accepted", "test_results": [], "execution_time": 0.0}

    results = []
    for tc in test_cases[:5]:  # Limit to 5 test cases
        r = await execute_single(code, language, tc.get("input", ""), tc.get("output", ""), time_limit)
        results.append(r)
        if not r.get("passed") and r["verdict"] in ["Runtime Error", "Time Limit Exceeded", "Compilation Error"]:
            break  # Stop early on fatal errors

    passed_all = all(r.get("passed") for r in results)
    verdict = "Accepted" if passed_all else next(
        (r["verdict"] for r in results if not r.get("passed")), "Wrong Answer"
    )
    avg_time = sum(r.get("time", 0) for r in results) / max(len(results), 1)
    return {"verdict": verdict, "test_results": results, "execution_time": round(avg_time, 3)}

# ───────────────────────────────────────────────
# LEADERBOARD HELPER
# ───────────────────────────────────────────────

async def calc_leaderboard(contest_id: str) -> list:
    contest = await db.contests.find_one({"id": contest_id}, {"_id": 0})
    if not contest:
        return []

    subs = await db.submissions.find(
        {"contest_id": contest_id, "verdict": "Accepted"},
        {"_id": 0}
    ).to_list(5000)

    user_stats: Dict[str, Any] = {}
    for sub in subs:
        uid = sub["user_id"]
        pid = sub["problem_id"]
        if uid not in user_stats:
            user_stats[uid] = {
                "user_id": uid,
                "username": sub.get("username", "Unknown"),
                "solved": {},
                "penalty": 0
            }
        if pid not in user_stats[uid]["solved"]:
            user_stats[uid]["solved"][pid] = sub.get("created_at", "")
            # Penalty: minutes from contest start to this submission
            if contest.get("start_time"):
                try:
                    start = datetime.fromisoformat(contest["start_time"].replace("Z", "+00:00"))
                    sub_time = datetime.fromisoformat(sub["created_at"].replace("Z", "+00:00"))
                    penalty_min = int((sub_time - start).total_seconds() / 60)
                    user_stats[uid]["penalty"] += max(0, penalty_min)
                except Exception:
                    pass

    board = []
    for uid, stats in user_stats.items():
        board.append({
            "user_id": stats["user_id"],
            "username": stats["username"],
            "solved_count": len(stats["solved"]),
            "penalty": stats["penalty"],
            "solved_problems": list(stats["solved"].keys())
        })

    board.sort(key=lambda x: (-x["solved_count"], x["penalty"]))
    for i, entry in enumerate(board):
        entry["rank"] = i + 1

    return board

# ───────────────────────────────────────────────
# AUTH ROUTES
# ───────────────────────────────────────────────

@api_router.post("/auth/register")
async def register(body: UserCreate):
    if not body.username.strip():
        raise HTTPException(status_code=400, detail="Username is required")
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await db.users.find_one({"username": body.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "username": body.username.strip(),
        "email": body.email.lower().strip(),
        "password_hash": hash_password(body.password),
        "role": "user",
        "solved_problems": [],
        "contest_history": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(doc)
    token = create_token(user_id, "user")
    return {
        "token": token,
        "user": {"id": user_id, "username": doc["username"], "email": doc["email"], "role": "user", "solved_count": 0}
    }

@api_router.post("/auth/login")
async def login(body: UserLogin):
    user = await db.users.find_one({"email": body.email.lower().strip()}, {"_id": 0})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user.get("role", "user"))
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user.get("role", "user"),
            "solved_count": len(user.get("solved_problems", []))
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user.get("role", "user"),
        "solved_count": len(current_user.get("solved_problems", [])),
        "contest_history": current_user.get("contest_history", []),
        "created_at": current_user.get("created_at", "")
    }

# ───────────────────────────────────────────────
# PROBLEM ROUTES
# ───────────────────────────────────────────────

@api_router.get("/problems")
async def list_problems(
    difficulty: Optional[str] = None,
    tag: Optional[str] = None,
    current_user=Depends(get_optional_user)
):
    query: dict = {}
    if difficulty:
        query["difficulty"] = difficulty
    if tag:
        query["tags"] = tag

    problems = await db.problems.find(query, {"_id": 0, "test_cases": 0}).to_list(500)

    solved_set = set()
    if current_user:
        solved_set = set(current_user.get("solved_problems", []))

    for p in problems:
        p["is_solved"] = p.get("id", "") in solved_set

    return problems

@api_router.get("/problems/{problem_id}")
async def get_problem(problem_id: str, current_user=Depends(get_optional_user)):
    problem = await db.problems.find_one({"id": problem_id}, {"_id": 0})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    result = {**problem}
    # Only expose test cases for admins; regular users see sample
    if not current_user or current_user.get("role") != "admin":
        result["test_cases"] = problem.get("test_cases", [])[:1]

    if current_user:
        result["is_solved"] = problem_id in current_user.get("solved_problems", [])

    return result

@api_router.post("/problems")
async def create_problem(body: ProblemCreate, admin=Depends(get_admin)):
    problem_id = str(uuid.uuid4())
    doc = {
        "id": problem_id,
        "title": body.title,
        "description": body.description,
        "difficulty": body.difficulty,
        "tags": body.tags,
        "sample_input": body.sample_input,
        "sample_output": body.sample_output,
        "test_cases": [tc.model_dump() for tc in body.test_cases],
        "hints": body.hints,
        "constraints": body.constraints,
        "time_limit": body.time_limit,
        "solved_count": 0,
        "created_by": admin["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.problems.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/problems/{problem_id}")
async def update_problem(problem_id: str, body: ProblemUpdate, admin=Depends(get_admin)):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if "test_cases" in update_data:
        update_data["test_cases"] = [
            tc if isinstance(tc, dict) else tc.model_dump() for tc in update_data["test_cases"]
        ]
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.problems.update_one({"id": problem_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Problem not found")

    updated = await db.problems.find_one({"id": problem_id}, {"_id": 0})
    return updated

@api_router.delete("/problems/{problem_id}")
async def delete_problem(problem_id: str, admin=Depends(get_admin)):
    result = await db.problems.delete_one({"id": problem_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Problem not found")
    return {"message": "Problem deleted successfully"}

# AI Hint
@api_router.post("/problems/{problem_id}/hint")
async def get_hint(problem_id: str, body: HintRequest, current_user=Depends(get_current_user)):
    problem = await db.problems.find_one({"id": problem_id}, {"_id": 0})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    hint_level = min(max(body.hint_level, 1), 3)
    static_hints = problem.get("hints", [])

    # Try static hints first
    if static_hints and hint_level <= len(static_hints):
        return {"hint": static_hints[hint_level - 1], "source": "static", "level": hint_level}

    # Fall back to Gemini AI
    if not GEMINI_API_KEY:
        fallback = static_hints[-1] if static_hints else "Think carefully about the time complexity. Can you optimize with a better data structure?"
        return {"hint": fallback, "source": "static", "level": hint_level}

    try:
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=f"hint-{uuid.uuid4()}",
            system_message=(
                "You are a competitive programming mentor. Give concise, educational hints (2-4 sentences) "
                "that guide without revealing the complete solution. Be specific about algorithms/patterns."
            )
        ).with_model("gemini", "gemini-3-flash-preview")

        level_instructions = {
            1: "Give a very subtle conceptual hint about the general approach",
            2: "Hint at the specific algorithm or data structure (e.g., 'think about hash maps' or 'try dynamic programming')",
            3: "Give a more detailed algorithmic hint with pseudocode-level guidance (but not the complete solution)"
        }

        msg = UserMessage(text=(
            f"Problem: {problem['title']}\n"
            f"Description: {problem['description'][:600]}\n\n"
            f"User code so far:\n```\n{body.code[:400] if body.code else '# No code yet'}\n```\n\n"
            f"Task: {level_instructions.get(hint_level, level_instructions[1])}"
        ))

        response = await chat.send_message(msg)
        return {"hint": response, "source": "ai", "level": hint_level}
    except Exception as e:
        logger.error(f"Gemini hint error: {e}")
        fallback = static_hints[-1] if static_hints else "Break the problem into smaller steps and think about which data structure fits best."
        return {"hint": fallback, "source": "static", "level": hint_level}

# ───────────────────────────────────────────────
# CONTEST ROUTES
# ───────────────────────────────────────────────

@api_router.get("/contests")
async def list_contests(current_user=Depends(get_optional_user)):
    contests = await db.contests.find({}, {"_id": 0}).to_list(100)
    result = []
    for c in contests:
        entry = {
            "id": c["id"],
            "title": c["title"],
            "description": c.get("description", ""),
            "problem_count": len(c.get("problem_ids", [])),
            "duration": c["duration"],
            "join_code": c["join_code"],
            "start_time": c.get("start_time"),
            "end_time": c.get("end_time"),
            "status": c.get("status", "active"),
            "participant_count": len(c.get("participants", [])),
            "created_at": c["created_at"],
            "is_joined": (current_user["id"] in c.get("participants", [])) if current_user else False
        }
        result.append(entry)
    return result

@api_router.get("/contests/{contest_id}")
async def get_contest(contest_id: str, current_user=Depends(get_optional_user)):
    contest = await db.contests.find_one({"id": contest_id}, {"_id": 0})
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")

    problems = []
    for pid in contest.get("problem_ids", []):
        p = await db.problems.find_one({"id": pid}, {"_id": 0, "test_cases": 0})
        if p:
            if current_user:
                sub = await db.submissions.find_one({
                    "user_id": current_user["id"],
                    "problem_id": pid,
                    "contest_id": contest_id,
                    "verdict": "Accepted"
                })
                p["solved_in_contest"] = bool(sub)
            problems.append(p)

    return {
        **{k: v for k, v in contest.items() if k != "_id"},
        "problems": problems,
        "is_joined": (current_user["id"] in contest.get("participants", [])) if current_user else False
    }

@api_router.post("/contests")
async def create_contest(body: ContestCreate, admin=Depends(get_admin)):
    contest_id = str(uuid.uuid4())
    join_code = generate_join_code()
    now = datetime.now(timezone.utc)
    end_time = (now + timedelta(minutes=body.duration)).isoformat()

    doc = {
        "id": contest_id,
        "title": body.title,
        "description": body.description,
        "problem_ids": body.problem_ids,
        "duration": body.duration,
        "join_code": join_code,
        "start_time": now.isoformat(),
        "end_time": end_time,
        "status": "active",
        "participants": [],
        "created_by": admin["id"],
        "created_at": now.isoformat()
    }
    await db.contests.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.post("/contests/join")
async def join_contest(body: JoinContestRequest, current_user=Depends(get_current_user)):
    contest = await db.contests.find_one({"join_code": body.join_code.upper().strip()}, {"_id": 0})
    if not contest:
        raise HTTPException(status_code=404, detail="Invalid join code. Please check and try again.")

    await db.contests.update_one(
        {"id": contest["id"]},
        {"$addToSet": {"participants": current_user["id"]}}
    )
    return {"contest_id": contest["id"], "message": "Joined successfully!", "contest": contest}

@api_router.get("/contests/{contest_id}/leaderboard")
async def get_leaderboard(contest_id: str):
    board = await calc_leaderboard(contest_id)
    return {"leaderboard": board}

@api_router.delete("/contests/{contest_id}")
async def delete_contest(contest_id: str, admin=Depends(get_admin)):
    result = await db.contests.delete_one({"id": contest_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contest not found")
    return {"message": "Contest deleted"}

# ───────────────────────────────────────────────
# SUBMISSION ROUTES
# ───────────────────────────────────────────────

@api_router.post("/submit")
async def submit_code(body: SubmitCodeRequest, current_user=Depends(get_current_user)):
    # Validate problem
    problem = await db.problems.find_one({"id": body.problem_id}, {"_id": 0})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # If contest submission, verify participation
    if body.contest_id:
        contest = await db.contests.find_one({"id": body.contest_id}, {"_id": 0})
        if not contest:
            raise HTTPException(status_code=404, detail="Contest not found")
        if current_user["id"] not in contest.get("participants", []):
            raise HTTPException(status_code=403, detail="You must join the contest first")

    # Run code
    test_cases = problem.get("test_cases", [])
    exec_result = await run_submission(
        body.code, body.language, test_cases, problem.get("time_limit", 5)
    )

    verdict = exec_result["verdict"]

    # Save submission
    sub_id = str(uuid.uuid4())
    sub_doc = {
        "id": sub_id,
        "user_id": current_user["id"],
        "username": current_user["username"],
        "problem_id": body.problem_id,
        "contest_id": body.contest_id,
        "language": body.language,
        "code": body.code,
        "verdict": verdict,
        "execution_time": exec_result["execution_time"],
        "test_results": exec_result["test_results"],
        "keystrokes": [k.model_dump() for k in (body.keystrokes or [])],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.submissions.insert_one(sub_doc)
    sub_doc.pop("_id", None)

    # Update stats on Accepted
    if verdict == "Accepted":
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$addToSet": {"solved_problems": body.problem_id}}
        )
        await db.problems.update_one(
            {"id": body.problem_id},
            {"$inc": {"solved_count": 1}}
        )

        # Real-time leaderboard broadcast for contest submissions
        if body.contest_id:
            leaderboard = await calc_leaderboard(body.contest_id)
            await manager.broadcast(
                body.contest_id,
                {"type": "leaderboard_update", "data": leaderboard}
            )

    return sub_doc

@api_router.get("/submissions/problem/{problem_id}")
async def get_problem_submissions(problem_id: str, current_user=Depends(get_current_user)):
    subs = await db.submissions.find(
        {"problem_id": problem_id, "user_id": current_user["id"]},
        {"_id": 0, "keystrokes": 0}
    ).sort("created_at", -1).to_list(20)
    return subs

@api_router.get("/submissions/{submission_id}/playback")
async def get_playback(submission_id: str, current_user=Depends(get_current_user)):
    sub = await db.submissions.find_one(
        {"id": submission_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub

@api_router.get("/submissions/{submission_id}")
async def get_submission(submission_id: str, current_user=Depends(get_current_user)):
    sub = await db.submissions.find_one(
        {"id": submission_id, "user_id": current_user["id"]},
        {"_id": 0, "keystrokes": 0}
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    return sub

# ───────────────────────────────────────────────
# USER PROFILE ROUTES
# ───────────────────────────────────────────────

@api_router.get("/users/profile")
async def get_my_profile(current_user=Depends(get_current_user)):
    recent_subs = await db.submissions.find(
        {"user_id": current_user["id"]},
        {"_id": 0, "keystrokes": 0, "code": 0, "test_results": 0}
    ).sort("created_at", -1).to_list(15)

    solved_ids = current_user.get("solved_problems", [])
    solved_problems = await db.problems.find(
        {"id": {"$in": solved_ids}},
        {"_id": 0, "test_cases": 0, "hints": 0, "description": 0}
    ).to_list(100)

    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user.get("role", "user"),
        "solved_count": len(solved_ids),
        "solved_problems": solved_problems,
        "recent_submissions": recent_subs,
        "contest_history": current_user.get("contest_history", []),
        "created_at": current_user.get("created_at", "")
    }

@api_router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user["id"],
        "username": user["username"],
        "role": user.get("role", "user"),
        "solved_count": len(user.get("solved_problems", [])),
        "created_at": user.get("created_at", "")
    }

# ───────────────────────────────────────────────
# WEBSOCKET - REAL-TIME LEADERBOARD
# ───────────────────────────────────────────────

@api_router.websocket("/ws/contest/{contest_id}")
async def ws_contest(websocket: WebSocket, contest_id: str):
    await manager.connect(websocket, contest_id)
    # Send initial state
    leaderboard = await calc_leaderboard(contest_id)
    await websocket.send_json({"type": "leaderboard_update", "data": leaderboard})

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, contest_id)
    except Exception as e:
        logger.error(f"WS error in contest {contest_id}: {e}")
        manager.disconnect(websocket, contest_id)

# ───────────────────────────────────────────────
# ADMIN ROUTES
# ───────────────────────────────────────────────

@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(get_admin)):
    users = await db.users.count_documents({})
    problems = await db.problems.count_documents({})
    contests = await db.contests.count_documents({})
    submissions = await db.submissions.count_documents({})
    accepted = await db.submissions.count_documents({"verdict": "Accepted"})
    return {
        "total_users": users,
        "total_problems": problems,
        "total_contests": contests,
        "total_submissions": submissions,
        "accepted_submissions": accepted
    }

# ───────────────────────────────────────────────
# HEALTH CHECK
# ───────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "CodeArena API v1.0", "status": "running"}

# ───────────────────────────────────────────────
# SEED DATA
# ───────────────────────────────────────────────

async def seed_data():
    # Create admin user if none exists
    if not await db.users.find_one({"role": "admin"}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "username": "admin",
            "email": "admin@codearena.com",
            "password_hash": hash_password("Admin@123"),
            "role": "admin",
            "solved_problems": [],
            "contest_history": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin created: admin@codearena.com / Admin@123")

    # Seed sample problems
    if await db.problems.count_documents({}) == 0:
        problems = [
            {
                "id": str(uuid.uuid4()),
                "title": "Two Sum",
                "description": """Given an array of integers and a target, return the **0-based indices** of the two numbers that add up to target.

**Input Format:**
- Line 1: Space-separated integers (the array)
- Line 2: Target integer

**Output Format:**
- Two space-separated indices (0-based)

**Example:**
```
Input:
2 7 11 15
9

Output:
0 1
```
Because `nums[0] + nums[1] = 2 + 7 = 9 = target`""",
                "difficulty": "easy",
                "tags": ["array", "hash-table"],
                "sample_input": "2 7 11 15\n9",
                "sample_output": "0 1",
                "test_cases": [
                    {"input": "2 7 11 15\n9", "output": "0 1"},
                    {"input": "3 2 4\n6", "output": "1 2"},
                    {"input": "3 3\n6", "output": "0 1"}
                ],
                "hints": [
                    "Think about storing numbers you've already seen in a data structure that allows O(1) lookup.",
                    "Use a dictionary (hash map). For each number, check if (target - number) already exists in the dict.",
                    "Iterate once. For nums[i], if (target - nums[i]) is in your dict, print its index and i. Otherwise, store nums[i]: i in the dict."
                ],
                "constraints": "2 <= len(nums) <= 10^4\nExactly one valid answer exists.",
                "time_limit": 5,
                "solved_count": 0,
                "created_by": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Fibonacci Number",
                "description": """Compute the N-th Fibonacci number.

```
F(0) = 0
F(1) = 1
F(n) = F(n-1) + F(n-2)
```

**Input:** A single integer n
**Output:** F(n)

**Examples:**
```
Input: 10  → Output: 55
Input: 0   → Output: 0
Input: 15  → Output: 610
```""",
                "difficulty": "easy",
                "tags": ["math", "dynamic-programming", "recursion"],
                "sample_input": "10",
                "sample_output": "55",
                "test_cases": [
                    {"input": "10", "output": "55"},
                    {"input": "0", "output": "0"},
                    {"input": "1", "output": "1"},
                    {"input": "15", "output": "610"}
                ],
                "hints": [
                    "Use an iterative approach — track the previous two Fibonacci numbers.",
                    "Initialize a, b = 0, 1. Loop n times: a, b = b, a+b. Then print a.",
                    "Read n from input(). If n == 0, print 0. Otherwise loop and track two variables."
                ],
                "constraints": "0 <= n <= 30",
                "time_limit": 5,
                "solved_count": 0,
                "created_by": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Valid Parentheses",
                "description": """Determine if a string of brackets is valid.

A string is valid if:
1. Every open bracket is closed by the same type
2. Open brackets are closed in the correct order

**Input:** A single string (only `()[]{}`)
**Output:** `True` or `False`

**Examples:**
```
Input: ()[]{}   → Output: True
Input: (]       → Output: False
Input: {[]}     → Output: True
```""",
                "difficulty": "medium",
                "tags": ["string", "stack"],
                "sample_input": "()[]{}",
                "sample_output": "True",
                "test_cases": [
                    {"input": "()[]{}","output": "True"},
                    {"input": "(]", "output": "False"},
                    {"input": "([)]", "output": "False"},
                    {"input": "{[]}", "output": "True"}
                ],
                "hints": [
                    "Use a stack. When you see an opening bracket, push it.",
                    "When you see a closing bracket, check if the stack's top is the matching opening bracket.",
                    "After processing all characters, the stack must be empty for the string to be valid."
                ],
                "constraints": "1 <= len(s) <= 10^4",
                "time_limit": 5,
                "solved_count": 0,
                "created_by": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Maximum Subarray",
                "description": """Find the contiguous subarray with the largest sum and return its sum.

**Input:** Space-separated integers
**Output:** Maximum subarray sum

**Examples:**
```
Input: -2 1 -3 4 -1 2 1 -5 4
Output: 6   (subarray [4,-1,2,1])

Input: 1
Output: 1
```""",
                "difficulty": "medium",
                "tags": ["array", "dynamic-programming", "divide-and-conquer"],
                "sample_input": "-2 1 -3 4 -1 2 1 -5 4",
                "sample_output": "6",
                "test_cases": [
                    {"input": "-2 1 -3 4 -1 2 1 -5 4", "output": "6"},
                    {"input": "1", "output": "1"},
                    {"input": "5 4 -1 7 8", "output": "23"}
                ],
                "hints": [
                    "Kadane's Algorithm: at each element, decide whether to extend the current subarray or start fresh.",
                    "Track `current_sum` and `max_sum`. Update: `current_sum = max(num, current_sum + num)`.",
                    "Initialize both to nums[0]. Iterate from index 1. At each step update both variables."
                ],
                "constraints": "1 <= len(nums) <= 10^5",
                "time_limit": 5,
                "solved_count": 0,
                "created_by": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Palindrome Check",
                "description": """Determine if a string is a palindrome, considering only alphanumeric characters and ignoring case.

**Input:** A single string (may have spaces/punctuation)
**Output:** `True` or `False`

**Examples:**
```
Input: A man a plan a canal Panama
Output: True

Input: race a car
Output: False
```""",
                "difficulty": "easy",
                "tags": ["string", "two-pointers"],
                "sample_input": "A man a plan a canal Panama",
                "sample_output": "True",
                "test_cases": [
                    {"input": "A man a plan a canal Panama", "output": "True"},
                    {"input": "race a car", "output": "False"},
                    {"input": " ", "output": "True"}
                ],
                "hints": [
                    "Filter the string: keep only alphanumeric characters, convert to lowercase.",
                    "Check if the filtered string equals its reverse: `s == s[::-1]`.",
                    "Use two pointers (left, right) moving inward, skip non-alphanumeric chars."
                ],
                "constraints": "1 <= len(s) <= 2*10^5",
                "time_limit": 5,
                "solved_count": 0,
                "created_by": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.problems.insert_many(problems)
        logger.info(f"Seeded {len(problems)} sample problems")

# ───────────────────────────────────────────────
# APP LIFECYCLE
# ───────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    await seed_data()
    logger.info("CodeArena API started successfully")

@app.on_event("shutdown")
async def shutdown():
    client.close()

# Mount router and middleware
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
