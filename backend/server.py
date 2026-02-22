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
# from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import json
import google.generativeai as genai
import logging
import uuid
import random
import string
import subprocess
import sys
import asyncio
import time
from pathlib import Path
from additional_problems import ADDITIONAL_PROBLEMS
from judge import CodeRunner
from coding_assistant import create_coding_assistant
from pair_manager import PairRoomManager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ───────────────────────────────────────────────
# DATABASE
# ───────────────────────────────────────────────
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize modular Judge
# Fix for Windows asyncio subprocess bug (NotImplementedError)
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
judge = CodeRunner()

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

class AskAIRequest(BaseModel):
    code: str = ""
    language: str = "python"
    error: str = ""
    question: str

# Per-user per-problem AI assistant sessions (in-memory)
assistant_sessions: dict = {}

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

async def execute_single(code: str, language: str, test_input: str, expected: str, time_limit: float = 2.0) -> dict:
    """Wrapper for modular judge."""
    result = await judge.execute(code, language, test_input, expected, time_limit)
    return {
        "verdict": result.verdict,
        "output": result.output,
        "time": result.time,
        "passed": result.passed,
        "expected": result.expected
    }

async def run_submission(code: str, language: str, test_cases: list, time_limit: float = 2.0) -> dict:
    if not test_cases:
        return {"verdict": "Accepted", "test_results": [], "execution_time": 0.0}

    results = []
    max_test_cases = 10 
    for tc in test_cases[:max_test_cases]:
        r = await execute_single(code, language, tc.get("input", ""), tc.get("output", ""), time_limit)
        results.append(r)
        if not r.get("passed"):
            break

    passed_all = all(r.get("passed") for r in results)
    verdict = "Accepted" if (passed_all and len(results) >= min(len(test_cases), max_test_cases)) else next(
        (r["verdict"] for r in results if not r.get("passed")), "Wrong Answer"
    )
    
    max_time = max((r.get("time", 0) for r in results), default=0.0)
    return {
        "verdict": verdict,
        "test_results": results,
        "execution_time": round(max_time, 3)
    }

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
        "current_streak": 0,
        "longest_streak": 0,
        "last_solved_date": "",
        "solved_problems": [],
        "contest_history": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(doc)
    token = create_token(user_id, "user")
    return {
        "token": token,
        "user": {
            "id": user_id, 
            "username": doc["username"], 
            "email": doc["email"], 
            "role": "user", 
            "solved_count": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "last_solved_date": ""
        }
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
            "solved_count": len(user.get("solved_problems", [])),
            "current_streak": user.get("current_streak", 0),
            "longest_streak": user.get("longest_streak", 0),
            "last_solved_date": user.get("last_solved_date", "")
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user=Depends(get_current_user)):
    # Calculate total submissions and activity map
    subs = await db.submissions.find(
        {"user_id": current_user["id"]}, 
        {"created_at": 1, "_id": 0}
    ).to_list(10000)
    
    activity = {}
    for sub in subs:
        if "created_at" in sub and sub["created_at"]:
            date_str = sub["created_at"].split("T")[0]
            activity[date_str] = activity.get(date_str, 0) + 1

    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user.get("role", "user"),
        "solved_count": len(current_user.get("solved_problems", [])),
        "contest_history": current_user.get("contest_history", []),
        "created_at": current_user.get("created_at", ""),
        "current_streak": current_user.get("current_streak", 0),
        "longest_streak": current_user.get("longest_streak", 0),
        "last_solved_date": current_user.get("last_solved_date", ""),
        "total_submissions": len(subs),
        "activity": activity
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
        # chat = LlmChat(
        #     api_key=GEMINI_API_KEY,
        #     session_id=f"hint-{uuid.uuid4()}",
        #     system_message=(
        #         "You are a competitive programming mentor. Give concise, educational hints (2-4 sentences) "
        #         "that guide without revealing the complete solution. Be specific about algorithms/patterns."
        #     )
        # ).with_model("gemini", "gemini-3-flash-preview")
        #
        # level_instructions = {
        #     1: "Give a very subtle conceptual hint about the general approach",
        #     2: "Hint at the specific algorithm or data structure (e.g., 'think about hash maps' or 'try dynamic programming')",
        #     3: "Give a more detailed algorithmic hint with pseudocode-level guidance (but not the complete solution)"
        # }
        #
        # msg = UserMessage(text=(
        #     f"Problem: {problem['title']}\n"
        #     f"Description: {problem['description'][:600]}\n\n"
        #     f"User code so far:\n```\n{body.code[:400] if body.code else '# No code yet'}\n```\n\n"
        #     f"Task: {level_instructions.get(hint_level, level_instructions[1])}"
        # ))
        #
        # response = await chat.send_message(msg)
        raise Exception("AI hints disabled due to missing dependency")
    except Exception as e:
        logger.error(f"Gemini hint error: {e}")
        fallback = static_hints[-1] if static_hints else "Break the problem into smaller steps and think about which data structure fits best."
        return {"hint": fallback, "source": "static", "level": hint_level}

# ───────────────────────────────────────────────
# DAILY CHALLENGE ROUTES
# ───────────────────────────────────────────────

async def get_or_create_daily_challenge():
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    current = await db.daily_challenge.find_one({"date": today_str}, {"_id": 0})
    if current:
        return current

    pipeline = [{"$sample": {"size": 1}}]
    random_problems = await db.problems.aggregate(pipeline).to_list(1)
    
    if not random_problems:
        return None

    problem = random_problems[0]
    
    daily_doc = {
        "id": str(uuid.uuid4()),
        "date": today_str,
        "problem_id": problem["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.daily_challenge.find_one_and_update(
        {"date": today_str},
        {"$setOnInsert": daily_doc},
        upsert=True,
        return_document=True
    )
    
    result.pop("_id", None)
    return result

@api_router.get("/daily")
async def get_daily_challenge(current_user=Depends(get_optional_user)):
    daily = await get_or_create_daily_challenge()
    if not daily:
        raise HTTPException(status_code=404, detail="No problems available")
        
    problem = await db.problems.find_one({"id": daily["problem_id"]}, {"_id": 0})
    if not problem:
        raise HTTPException(status_code=404, detail="Daily problem not found")
        
    result = {**problem}
    
    if not current_user or current_user.get("role") != "admin":
        result["test_cases"] = problem.get("test_cases", [])[:1]
        
    result["is_solved"] = False
    if current_user:
        result["is_solved"] = problem["id"] in current_user.get("solved_problems", [])
        
    return {"date": daily["date"], "problem": result}

@api_router.get("/daily/leaderboard")
async def get_daily_leaderboard(date: Optional[str] = None):
    target_date = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    leaderboard = await db.daily_leaderboard.find(
        {"date": target_date}, 
        {"_id": 0}
    ).sort([("attempts", 1), ("accepted_time", 1)]).to_list(100)
    
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1
        
    return {"date": target_date, "leaderboard": leaderboard}

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

    # Track attempts for current user on this problem TODAY 
    # to facilitate the daily leaderboard system.
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.temp_attempts.update_one(
        {"date": today_str, "user_id": current_user["id"], "problem_id": body.problem_id},
        {"$inc": {"attempts": 1}},
        upsert=True
    )

    # Check if this submitted problem is today's daily challenge
    daily = await db.daily_challenge.find_one({"date": today_str})
    is_daily = daily and daily["problem_id"] == body.problem_id

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

        if is_daily:
            # Check if user already has an entry on the leaderboard for today
            board_entry = await db.daily_leaderboard.find_one({
                "date": today_str,
                "user_id": current_user["id"]
            })
            
            if not board_entry:
                temp_rec = await db.temp_attempts.find_one({
                    "date": today_str, "user_id": current_user["id"], "problem_id": body.problem_id
                })
                attempts_count = temp_rec["attempts"] if temp_rec else 1
                
                await db.daily_leaderboard.insert_one({
                    "id": str(uuid.uuid4()),
                    "date": today_str,
                    "problem_id": body.problem_id,
                    "user_id": current_user["id"],
                    "username": current_user["username"],
                    "attempts": attempts_count,
                    "accepted_time": datetime.now(timezone.utc).isoformat()
                })
                
                # Update Streak
                user_record = await db.users.find_one({"id": current_user["id"]})
                if user_record:
                    last_solved = user_record.get("last_solved_date")
                    current_streak = user_record.get("current_streak", 0)
                    longest_streak = user_record.get("longest_streak", 0)
                    
                    if last_solved != today_str:
                        if last_solved:
                            try:
                                last_date_obj = datetime.strptime(last_solved, "%Y-%m-%d").date()
                                today_obj = datetime.now(timezone.utc).date()
                                delta = (today_obj - last_date_obj).days
                                
                                if delta == 1:
                                    current_streak += 1
                                else:
                                    current_streak = 1
                            except ValueError:
                                current_streak = 1
                        else:
                            current_streak = 1
                            
                        longest_streak = max(longest_streak, current_streak)
                        
                        await db.users.update_one(
                            {"id": current_user["id"]},
                            {"$set": {
                                "current_streak": current_streak,
                                "longest_streak": longest_streak,
                                "last_solved_date": today_str
                            }}
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
# AI CODING ASSISTANT ROUTES
# ───────────────────────────────────────────────

@api_router.post("/problems/{problem_id}/ask_ai")
async def ask_ai_assistant(
    problem_id: str,
    req: AskAIRequest,
    current_user=Depends(get_current_user)
):
    """Conversational AI mentor to help debug code using LangChain + Gemini."""
    problem = await db.problems.find_one({"id": problem_id}, {"_id": 0, "test_cases": 0})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    session_key = f"{current_user['id']}_{problem_id}"

    if session_key not in assistant_sessions:
        problem_context = (
            f"Title: {problem['title']}\n"
            f"Description: {problem['description'][:3000]}\n"
            f"Tags: {', '.join(problem.get('tags', []))}\n"
            f"Current Code:\n{req.code[:2000]}\n"
            f"Error:\n{req.error[:500]}"
        )
        try:
            assistant_sessions[session_key] = create_coding_assistant(
                problem_context=problem_context,
                language=req.language
            )
        except Exception as e:
            logger.error(f"Failed to create assistant session: {e}")
            raise HTTPException(status_code=500, detail="AI service unavailable")

    chain = assistant_sessions[session_key]
    try:
        response = await asyncio.to_thread(chain.predict, input=req.question)
        return {"response": response}
    except Exception as e:
        logger.error(f"AI assistant prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
        
        # Add additional problems
        for prob in ADDITIONAL_PROBLEMS:
            prob_doc = {
                "id": str(uuid.uuid4()),
                "title": prob["title"],
                "description": prob["description"],
                "difficulty": prob["difficulty"],
                "tags": prob["tags"],
                "sample_input": prob["sample_input"],
                "sample_output": prob["sample_output"],
                "test_cases": prob["test_cases"],
                "hints": prob["hints"],
                "constraints": prob["constraints"],
                "time_limit": prob["time_limit"],
                "solved_count": 0,
                "created_by": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.problems.insert_one(prob_doc)
        logger.info(f"Seeded {len(ADDITIONAL_PROBLEMS)} additional problems")

# ───────────────────────────────────────────────
# DAILY CHALLENGE ROUTES
# ───────────────────────────────────────────────

@api_router.get("/daily-challenge")
async def get_daily_challenge(current_user=Depends(get_optional_user)):
    """Get today's daily challenge problem"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if we have a daily challenge set for today
    daily = await db.daily_challenges.find_one({"date": today}, {"_id": 0})
    
    if not daily or not daily.get("problem_id"):
        # Auto-select a random problem as daily challenge
        problems = await db.problems.find({}, {"_id": 0}).to_list(100)
        if not problems:
            raise HTTPException(status_code=404, detail="No problems available")
        
        selected = random.choice(problems)
        daily = {
            "id": daily.get("id") if daily else str(uuid.uuid4()),
            "date": today,
            "problem_id": selected["id"],
            "created_at": daily.get("created_at") if daily else datetime.now(timezone.utc).isoformat()
        }
        await db.daily_challenges.update_one({"date": today}, {"$set": daily}, upsert=True)
    
    # Fetch the problem
    problem = await db.problems.find_one({"id": daily["problem_id"]}, {"_id": 0, "test_cases": 0})
    if not problem:
        raise HTTPException(status_code=404, detail="Daily challenge problem not found")
    
    is_completed = False
    if current_user:
        is_completed = daily["problem_id"] in current_user.get("solved_problems", [])
    
    return {
        "date": today,
        "problem": problem,
        "is_completed": is_completed
    }

@api_router.get("/daily-challenge/streak")
async def get_daily_streak(current_user=Depends(get_current_user)):
    """Get user's daily challenge streak"""
    # Get last 365 days of submissions
    cutoff = (datetime.now(timezone.utc) - timedelta(days=365)).isoformat()
    
    submissions = await db.submissions.find(
        {"user_id": current_user["id"], "created_at": {"$gte": cutoff}, "verdict": "Accepted"},
        {"_id": 0, "created_at": 1}
    ).to_list(10000)
    
    # Create activity map (date -> count)
    activity = {}
    for sub in submissions:
        date = sub["created_at"][:10]  # YYYY-MM-DD
        activity[date] = activity.get(date, 0) + 1
    
    # Calculate current streak
    streak = 0
    today = datetime.now(timezone.utc).date()
    check_date = today
    
    while True:
        date_str = check_date.strftime("%Y-%m-%d")
        if date_str in activity:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    
    return {
        "current_streak": streak,
        "activity": activity,
        "total_submissions": len(submissions)
    }

# ───────────────────────────────────────────────
# DISCUSSION ROUTES
# ───────────────────────────────────────────────

class DiscussionCreate(BaseModel):
    content: str
    parent_id: Optional[str] = None

@api_router.get("/problems/{problem_id}/discussions")
async def get_discussions(problem_id: str, current_user=Depends(get_optional_user)):
    """Get discussions for a problem"""
    discussions = await db.discussions.find(
        {"problem_id": problem_id, "parent_id": None},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Get replies for each discussion
    for disc in discussions:
        replies = await db.discussions.find(
            {"parent_id": disc["id"]},
            {"_id": 0}
        ).sort("created_at", 1).to_list(50)
        disc["replies"] = replies
        disc["reply_count"] = len(replies)
        
        # Check if current user has voted
        if current_user:
            vote = await db.discussion_votes.find_one({
                "discussion_id": disc["id"],
                "user_id": current_user["id"]
            })
            disc["user_vote"] = vote["vote_type"] if vote else None
    
    return discussions

@api_router.post("/problems/{problem_id}/discussions")
async def create_discussion(problem_id: str, body: DiscussionCreate, current_user=Depends(get_current_user)):
    """Create a discussion or reply"""
    # Verify problem exists
    problem = await db.problems.find_one({"id": problem_id})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    if len(body.content.strip()) < 3:
        raise HTTPException(status_code=400, detail="Content too short")
    
    disc_id = str(uuid.uuid4())
    doc = {
        "id": disc_id,
        "problem_id": problem_id,
        "user_id": current_user["id"],
        "username": current_user["username"],
        "content": body.content.strip(),
        "parent_id": body.parent_id,
        "upvotes": 0,
        "downvotes": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.discussions.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.post("/discussions/{discussion_id}/vote")
async def vote_discussion(discussion_id: str, vote_type: str, current_user=Depends(get_current_user)):
    """Vote on a discussion (upvote/downvote)"""
    if vote_type not in ["up", "down"]:
        raise HTTPException(status_code=400, detail="Invalid vote type")
    
    discussion = await db.discussions.find_one({"id": discussion_id})
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    # Check existing vote
    existing = await db.discussion_votes.find_one({
        "discussion_id": discussion_id,
        "user_id": current_user["id"]
    })
    
    if existing:
        if existing["vote_type"] == vote_type:
            # Remove vote
            await db.discussion_votes.delete_one({"_id": existing["_id"]})
            inc_field = "upvotes" if vote_type == "up" else "downvotes"
            await db.discussions.update_one({"id": discussion_id}, {"$inc": {inc_field: -1}})
            return {"message": "Vote removed"}
        else:
            # Change vote
            await db.discussion_votes.update_one(
                {"_id": existing["_id"]},
                {"$set": {"vote_type": vote_type}}
            )
            if vote_type == "up":
                await db.discussions.update_one({"id": discussion_id}, {"$inc": {"upvotes": 1, "downvotes": -1}})
            else:
                await db.discussions.update_one({"id": discussion_id}, {"$inc": {"upvotes": -1, "downvotes": 1}})
            return {"message": "Vote changed"}
    else:
        # New vote
        await db.discussion_votes.insert_one({
            "discussion_id": discussion_id,
            "user_id": current_user["id"],
            "vote_type": vote_type,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        inc_field = "upvotes" if vote_type == "up" else "downvotes"
        await db.discussions.update_one({"id": discussion_id}, {"$inc": {inc_field: 1}})
        return {"message": "Voted"}

# ───────────────────────────────────────────────
# PROBLEM RATING ROUTES
# ───────────────────────────────────────────────

@api_router.post("/problems/{problem_id}/rate")
async def rate_problem(problem_id: str, rating: int, current_user=Depends(get_current_user)):
    """Rate a problem (1-5 stars)"""
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    
    problem = await db.problems.find_one({"id": problem_id})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Upsert rating
    await db.problem_ratings.update_one(
        {"problem_id": problem_id, "user_id": current_user["id"]},
        {"$set": {"rating": rating, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    # Calculate average rating
    ratings = await db.problem_ratings.find({"problem_id": problem_id}).to_list(10000)
    avg = sum(r["rating"] for r in ratings) / len(ratings) if ratings else 0
    
    await db.problems.update_one(
        {"id": problem_id},
        {"$set": {"average_rating": round(avg, 2), "rating_count": len(ratings)}}
    )
    
    return {"average_rating": round(avg, 2), "rating_count": len(ratings)}

# ───────────────────────────────────────────────
# GLOBAL LEADERBOARD ROUTES
# ───────────────────────────────────────────────

@api_router.get("/leaderboard/global")
async def get_global_leaderboard(limit: int = 50, current_user=Depends(get_optional_user)):
    """Get global user rankings with Time Complexity / Execution Time bonuses"""
    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    
    rankings = []
    for user in users:
        solved_count = len(user.get("solved_problems", []))
        
        # Calculate Average Execution Time using Aggregation
        pipeline = [
            {"$match": {"user_id": user["id"], "verdict": "Accepted"}},
            {"$group": {
                "_id": None,
                "avg_time": {"$avg": "$execution_time"},
                "total_accepted": {"$sum": 1}
            }}
        ]
        agg = await db.submissions.aggregate(pipeline).to_list(1)
        
        avg_time = agg[0]["avg_time"] if agg and agg[0].get("avg_time") else 0.5
        total_accepted = agg[0]["total_accepted"] if agg else 0
        total_subs = await db.submissions.count_documents({"user_id": user["id"]})
        
        # Scoring logic heavily rewarding execution time efficiency
        safe_time = max(avg_time, 0.001)
        time_bonus = min(int(10.0 / safe_time), 5000) 
        score = (solved_count * 1000) + time_bonus if solved_count > 0 else 0
        
        rankings.append({
            "user_id": user["id"],
            "username": user["username"],
            "solved_count": solved_count,
            "avg_time": round(avg_time, 3),
            "accuracy": round((total_accepted / total_subs * 100) if total_subs > 0 else 0, 1),
            "score": score
        })
    
    # Sort by score descending
    rankings.sort(key=lambda x: (-x["score"], x["avg_time"]))
    
    # Add ranks
    for i, r in enumerate(rankings):
        r["rank"] = i + 1
        if current_user and r["user_id"] == current_user["id"]:
            r["is_current_user"] = True
    
    return rankings[:limit]

@api_router.get("/users/progress")
async def get_user_progress(current_user=Depends(get_current_user)):
    """Generates the 30 day history chart data for the user progress graph"""
    board = await get_global_leaderboard(limit=10000)
    current_rank = len(board) + 1
    current_score = 0
    
    for r in board:
        if r["user_id"] == current_user["id"]:
            current_rank = r["rank"]
            current_score = r["score"]
            break
            
    # Calculate daily score accumulation based on their past solved problems
    subs = await db.submissions.find(
        {"user_id": current_user["id"], "verdict": "Accepted"}, 
        {"created_at": 1}
    ).to_list(10000)
    
    acc_by_day = {}
    for s in subs:
        if "created_at" in s and s["created_at"]:
            day = s["created_at"].split("T")[0]
            acc_by_day[day] = acc_by_day.get(day, 0) + 1
            
    progress = []
    # Work backwards 30 days
    running_score = current_score
    end_date = datetime.now(timezone.utc)
    
    for i in range(30):
        target_obj = end_date - timedelta(days=i)
        target_date_str = target_obj.strftime("%Y-%m-%d")
        
        progress.insert(0, {
            "date": target_obj.strftime("%b %d"), 
            "score": max(0, running_score),
            "rank": max(1, current_rank + i*2) # dummy rank historical decay
        })
        
        # Reverse tracking the points they gained on this day
        daily_solves = acc_by_day.get(target_date_str, 0)
        if daily_solves > 0:
            running_score -= (daily_solves * 1000)
            
    return {
        "overall_rank": current_rank,
        "overall_score": current_score,
        "history": progress
    }

# ───────────────────────────────────────────────
# ROADMAP / TOPIC ROUTES
# ───────────────────────────────────────────────

TOPIC_ROADMAP = [
    {"id": "arrays", "name": "Arrays & Hashing", "order": 1, "tags": ["array", "hash-table", "hashing"]},
    {"id": "two-pointers", "name": "Two Pointers", "order": 2, "tags": ["two-pointers", "pointers"]},
    {"id": "sliding-window", "name": "Sliding Window", "order": 3, "tags": ["sliding-window", "window"]},
    {"id": "stack", "name": "Stack", "order": 4, "tags": ["stack"]},
    {"id": "binary-search", "name": "Binary Search", "order": 5, "tags": ["binary-search", "search"]},
    {"id": "linked-list", "name": "Linked List", "order": 6, "tags": ["linked-list"]},
    {"id": "trees", "name": "Trees", "order": 7, "tags": ["tree", "binary-tree", "bst"]},
    {"id": "tries", "name": "Tries", "order": 8, "tags": ["trie"]},
    {"id": "heap", "name": "Heap / Priority Queue", "order": 9, "tags": ["heap", "priority-queue"]},
    {"id": "backtracking", "name": "Backtracking", "order": 10, "tags": ["backtracking", "recursion"]},
    {"id": "graphs", "name": "Graphs", "order": 11, "tags": ["graph", "dfs", "bfs"]},
    {"id": "dp", "name": "Dynamic Programming", "order": 12, "tags": ["dynamic-programming", "dp"]},
    {"id": "greedy", "name": "Greedy", "order": 13, "tags": ["greedy"]},
    {"id": "math", "name": "Math & Geometry", "order": 14, "tags": ["math", "geometry"]},
    {"id": "bit-manipulation", "name": "Bit Manipulation", "order": 15, "tags": ["bit-manipulation", "bits"]}
]

@api_router.get("/roadmap")
async def get_roadmap(current_user=Depends(get_optional_user)):
    """Get topic-wise learning roadmap with problem counts"""
    result = []
    solved_set = set(current_user.get("solved_problems", [])) if current_user else set()
    
    for topic in TOPIC_ROADMAP:
        # Find problems with matching tags
        query = {"tags": {"$in": topic["tags"]}}
        problems = await db.problems.find(query, {"_id": 0, "id": 1, "title": 1, "difficulty": 1}).to_list(100)
        
        solved_count = sum(1 for p in problems if p["id"] in solved_set)
        
        result.append({
            "id": topic["id"],
            "name": topic["name"],
            "order": topic["order"],
            "tags": topic["tags"],
            "problem_count": len(problems),
            "solved_count": solved_count,
            "progress": round((solved_count / len(problems) * 100) if problems else 0, 1),
            "problems": problems
        })
    
    return result

@api_router.get("/problems/{problem_id}/similar")
async def get_similar_problems(problem_id: str, limit: int = 5, current_user=Depends(get_optional_user)):
    """Get similar problems based on tags"""
    problem = await db.problems.find_one({"id": problem_id}, {"_id": 0})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    tags = problem.get("tags", [])
    if not tags:
        return []
    
    # Find problems with similar tags
    similar = await db.problems.find(
        {"id": {"$ne": problem_id}, "tags": {"$in": tags}},
        {"_id": 0, "test_cases": 0, "hints": 0}
    ).to_list(50)
    
    # Score by tag overlap
    for p in similar:
        p["similarity_score"] = len(set(p.get("tags", [])) & set(tags))
    
    similar.sort(key=lambda x: -x["similarity_score"])
    
    # Mark solved
    if current_user:
        solved_set = set(current_user.get("solved_problems", []))
        for p in similar:
            p["is_solved"] = p["id"] in solved_set
    
    return similar[:limit]

# ───────────────────────────────────────────────
# AI ROADMAP GENERATOR
# ───────────────────────────────────────────────

class RoadmapRequest(BaseModel):
    preparation_time: str
    current_level: str = "Beginner"

@api_router.post("/roadmap/generate")
async def generate_dsa_roadmap(req: RoadmapRequest):
    """Generates a structured DSA interview roadmap using AI"""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key missing")
        
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""
Generate a structured DSA interview roadmap.

Time Available: {req.preparation_time}
Current Level: {req.current_level}

Return ONLY valid JSON in this exact format, with no markdown code block markers or extra text. Start directly with the opening curly brace.

{{
  "total_duration": "{req.preparation_time}",
  "difficulty_level": "{req.current_level}",
  "weekly_commitment": "X hours/week",
  "phases": [
    {{
      "phase": 1,
      "title": "Phase Name",
      "duration": "X weeks",
      "focus_topics": ["Topic1", "Topic2"],
      "practice_goal": "Number of problems",
      "platforms": ["LeetCode", "CodeStudio"],
      "milestones": ["Milestone1"]
    }}
  ],
  "revision_strategy": ["Strategy1", "Strategy2"],
  "mock_interview_plan": "Description"
}}

Rules:
- 4 to 6 phases
- Must be realistic for {req.preparation_time}
- Structured weekly progression
- Practical milestones
- Return raw JSON only, nothing else
"""
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean up any potential markdown formatting
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        return json.loads(text.strip())
        
    except Exception as e:
        logger.error(f"Roadmap generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ───────────────────────────────────────────────
# INTERVIEW KITS ROUTES
# ───────────────────────────────────────────────

INTERVIEW_KITS = [
    {
        "id": "google",
        "company": "Google",
        "description": "Top problems frequently asked in Google interviews",
        "difficulty_distribution": {"easy": 2, "medium": 5, "hard": 3},
        "tags": ["array", "dynamic-programming", "graph", "string", "tree"]
    },
    {
        "id": "meta",
        "company": "Meta (Facebook)",
        "description": "Problems commonly seen in Meta technical interviews",
        "difficulty_distribution": {"easy": 3, "medium": 4, "hard": 3},
        "tags": ["array", "string", "hash-table", "binary-search", "tree"]
    },
    {
        "id": "amazon",
        "company": "Amazon",
        "description": "Amazon's Leadership Principles focused technical questions",
        "difficulty_distribution": {"easy": 2, "medium": 6, "hard": 2},
        "tags": ["array", "tree", "dynamic-programming", "hash-table", "design"]
    },
    {
        "id": "microsoft",
        "company": "Microsoft",
        "description": "Microsoft interview preparation problems",
        "difficulty_distribution": {"easy": 3, "medium": 5, "hard": 2},
        "tags": ["array", "string", "linked-list", "tree", "graph"]
    },
    {
        "id": "apple",
        "company": "Apple",
        "description": "Apple technical interview preparation",
        "difficulty_distribution": {"easy": 2, "medium": 5, "hard": 3},
        "tags": ["array", "string", "tree", "design", "math"]
    }
]

@api_router.get("/interview-kits")
async def get_interview_kits(current_user=Depends(get_optional_user)):
    """Get list of company interview kits"""
    result = []
    solved_set = set(current_user.get("solved_problems", [])) if current_user else set()
    
    for kit in INTERVIEW_KITS:
        # Get problems matching the kit's tags
        problems = await db.problems.find(
            {"tags": {"$in": kit["tags"]}},
            {"_id": 0, "id": 1, "title": 1, "difficulty": 1, "tags": 1}
        ).to_list(20)
        
        solved_count = sum(1 for p in problems if p["id"] in solved_set)
        
        result.append({
            **kit,
            "problem_count": len(problems),
            "solved_count": solved_count,
            "progress": round((solved_count / len(problems) * 100) if problems else 0, 1)
        })
    
    return result

@api_router.get("/interview-kits/{kit_id}")
async def get_interview_kit_detail(kit_id: str, current_user=Depends(get_optional_user)):
    """Get detailed interview kit with problems"""
    kit = next((k for k in INTERVIEW_KITS if k["id"] == kit_id), None)
    if not kit:
        raise HTTPException(status_code=404, detail="Interview kit not found")
    
    problems = await db.problems.find(
        {"tags": {"$in": kit["tags"]}},
        {"_id": 0, "test_cases": 0, "hints": 0}
    ).to_list(30)
    
    solved_set = set(current_user.get("solved_problems", [])) if current_user else set()
    
    for p in problems:
        p["is_solved"] = p["id"] in solved_set
    
    return {
        **kit,
        "problems": problems,
        "solved_count": sum(1 for p in problems if p["is_solved"]),
        "problem_count": len(problems)
    }

# ───────────────────────────────────────────────
# AI CODE REVIEW ROUTES
# ───────────────────────────────────────────────

class CodeReviewRequest(BaseModel):
    submission_id: str

@api_router.post("/ai/code-review")
async def ai_code_review(body: CodeReviewRequest, current_user=Depends(get_current_user)):
    """Get AI-powered code review for a submission"""
    submission = await db.submissions.find_one(
        {"id": body.submission_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    problem = await db.problems.find_one({"id": submission["problem_id"]}, {"_id": 0})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    if not GEMINI_API_KEY:
        return {
            "review": "AI code review is not available. Please configure the Gemini API key.",
            "suggestions": [],
            "complexity_analysis": "N/A",
            "source": "fallback"
        }
    
    try:
        # chat = LlmChat(
        #     api_key=GEMINI_API_KEY,
        #     session_id=f"review-{uuid.uuid4()}",
        #     system_message=(
        #         "You are an expert code reviewer for competitive programming. "
        #         "Analyze the submitted code and provide: "
        #         "1. Overall quality assessment "
        #         "2. Time and space complexity analysis "
        #         "3. Specific suggestions for improvement "
        #         "4. Edge cases to consider "
        #         "Be concise but thorough. Format with markdown."
        #     )
        # ).with_model("gemini", "gemini-3-flash-preview")
        # 
        # msg = UserMessage(text=(
        #     f"Problem: {problem['title']}\n\n"
        #     f"Description: {problem['description'][:800]}\n\n"
        #     f"User's Code ({submission['language']}):\n```{submission['language']}\n{submission['code'][:2000]}\n```\n\n"
        #     f"Verdict: {submission['verdict']}\n"
        #     f"Execution Time: {submission['execution_time']}s\n\n"
        #     "Please review this code and provide feedback."
        # ))
        # 
        # response = await chat.send_message(msg)
        raise Exception("AI review disabled due to missing dependency")
        
        return {
            "review": response,
            "source": "ai",
            "submission_id": body.submission_id
        }
    except Exception as e:
        logger.error(f"AI code review error: {e}")
        return {
            "review": "Unable to generate AI review at this time. Please try again later.",
            "suggestions": [],
            "source": "error"
        }

# ───────────────────────────────────────────────
# BATTLE MODE ROUTES
# ───────────────────────────────────────────────

class BattleCreate(BaseModel):
    difficulty: Optional[str] = None

class BattleJoin(BaseModel):
    battle_id: str

@api_router.post("/battles/create")
async def create_battle(body: BattleCreate, current_user=Depends(get_current_user)):
    """Create a new 1v1 battle room"""
    battle_id = str(uuid.uuid4())
    join_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    # Select a random problem
    query = {}
    if body.difficulty:
        query["difficulty"] = body.difficulty
    
    problems = await db.problems.find(query, {"_id": 0, "id": 1}).to_list(100)
    if not problems:
        raise HTTPException(status_code=400, detail="No problems available")
    
    selected = random.choice(problems)
    
    battle = {
        "id": battle_id,
        "join_code": join_code,
        "problem_id": selected["id"],
        "difficulty": body.difficulty,
        "player1_id": current_user["id"],
        "player1_username": current_user["username"],
        "player2_id": None,
        "player2_username": None,
        "player1_solved": False,
        "player2_solved": False,
        "winner_id": None,
        "status": "waiting",  # waiting, active, finished
        "started_at": None,
        "finished_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.battles.insert_one(battle)
    battle.pop("_id", None)
    return battle

@api_router.post("/battles/join")
async def join_battle(body: BattleJoin, current_user=Depends(get_current_user)):
    """Join an existing battle"""
    battle = await db.battles.find_one({"join_code": body.battle_id.upper()}, {"_id": 0})
    if not battle:
        battle = await db.battles.find_one({"id": body.battle_id}, {"_id": 0})
    
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    
    if battle["status"] != "waiting":
        raise HTTPException(status_code=400, detail="Battle already started or finished")
    
    if battle["player1_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot join your own battle")
    
    await db.battles.update_one(
        {"id": battle["id"]},
        {
            "$set": {
                "player2_id": current_user["id"],
                "player2_username": current_user["username"],
                "status": "active",
                "started_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    updated = await db.battles.find_one({"id": battle["id"]}, {"_id": 0})
    return updated

@api_router.get("/battles/{battle_id}")
async def get_battle(battle_id: str, current_user=Depends(get_current_user)):
    """Get battle details"""
    battle = await db.battles.find_one({"id": battle_id}, {"_id": 0})
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    
    # Get problem details
    problem = await db.problems.find_one({"id": battle["problem_id"]}, {"_id": 0, "test_cases": 0})
    battle["problem"] = problem
    
    return battle

@api_router.post("/battles/{battle_id}/submit")
async def submit_battle_solution(battle_id: str, body: SubmitCodeRequest, current_user=Depends(get_current_user)):
    """Submit solution for a battle"""
    battle = await db.battles.find_one({"id": battle_id}, {"_id": 0})
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    
    if battle["status"] != "active":
        raise HTTPException(status_code=400, detail="Battle is not active")
    
    if current_user["id"] not in [battle["player1_id"], battle["player2_id"]]:
        raise HTTPException(status_code=403, detail="You are not a participant in this battle")
    
    # Get problem and run tests
    problem = await db.problems.find_one({"id": battle["problem_id"]}, {"_id": 0})
    test_cases = problem.get("test_cases", [])
    
    exec_result = await run_submission(body.code, body.language, test_cases, problem.get("time_limit", 5))
    
    is_player1 = current_user["id"] == battle["player1_id"]
    update_field = "player1_solved" if is_player1 else "player2_solved"
    
    if exec_result["verdict"] == "Accepted":
        update_data = {update_field: True}
        
        # Check if this player won
        other_solved = battle["player2_solved"] if is_player1 else battle["player1_solved"]
        if not other_solved:
            update_data["winner_id"] = current_user["id"]
            update_data["status"] = "finished"
            update_data["finished_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.battles.update_one({"id": battle_id}, {"$set": update_data})
    
    # Save submission
    sub_id = str(uuid.uuid4())
    sub_doc = {
        "id": sub_id,
        "user_id": current_user["id"],
        "username": current_user["username"],
        "problem_id": battle["problem_id"],
        "battle_id": battle_id,
        "language": body.language,
        "code": body.code,
        "verdict": exec_result["verdict"],
        "execution_time": exec_result["execution_time"],
        "test_results": exec_result["test_results"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.submissions.insert_one(sub_doc)
    sub_doc.pop("_id", None)
    
    # Broadcast update via WebSocket
    await manager.broadcast(f"battle_{battle_id}", {
        "type": "battle_update",
        "player_id": current_user["id"],
        "verdict": exec_result["verdict"],
        "solved": exec_result["verdict"] == "Accepted"
    })
    
    updated_battle = await db.battles.find_one({"id": battle_id}, {"_id": 0})
    
    return {
        "submission": sub_doc,
        "battle": updated_battle
    }

@api_router.get("/battles/active/list")
async def list_active_battles(current_user=Depends(get_current_user)):
    """List user's active and recent battles"""
    battles = await db.battles.find(
        {
            "$or": [
                {"player1_id": current_user["id"]},
                {"player2_id": current_user["id"]}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    return battles

# WebSocket for battle
@api_router.websocket("/ws/battle/{battle_id}")
async def ws_battle(websocket: WebSocket, battle_id: str):
    await manager.connect(websocket, f"battle_{battle_id}")
    
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"battle_{battle_id}")
    except Exception as e:
        logger.error(f"Battle WS error: {e}")
        manager.disconnect(websocket, f"battle_{battle_id}")

# ───────────────────────────────────────────────
# SOLUTION COMPARISON ROUTES
# ───────────────────────────────────────────────

@api_router.get("/problems/{problem_id}/solutions")
async def get_problem_solutions(problem_id: str, current_user=Depends(get_optional_user)):
    """Get accepted solutions for a problem (for comparison)"""
    # Only show solutions if user has solved it or is admin
    if current_user:
        has_solved = problem_id in current_user.get("solved_problems", [])
        is_admin = current_user.get("role") == "admin"
        
        if not has_solved and not is_admin:
            raise HTTPException(status_code=403, detail="Solve the problem first to view solutions")
    else:
        raise HTTPException(status_code=401, detail="Login required")
    
    solutions = await db.submissions.find(
        {"problem_id": problem_id, "verdict": "Accepted"},
        {"_id": 0, "keystrokes": 0, "test_results": 0}
    ).sort("execution_time", 1).to_list(20)
    
    # Group by user (one solution per user)
    seen_users = set()
    unique_solutions = []
    for sol in solutions:
        if sol["user_id"] not in seen_users:
            seen_users.add(sol["user_id"])
            unique_solutions.append(sol)
    
    return unique_solutions[:10]

# ───────────────────────────────────────────────
# USER ACTIVITY HEATMAP
# ───────────────────────────────────────────────

@api_router.get("/users/activity-heatmap")
async def get_activity_heatmap(current_user=Depends(get_current_user)):
    """Get user activity heatmap data for past year"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=365)).isoformat()
    
    submissions = await db.submissions.find(
        {"user_id": current_user["id"], "created_at": {"$gte": cutoff}},
        {"_id": 0, "created_at": 1, "verdict": 1}
    ).to_list(10000)
    
    # Group by date
    activity = {}
    for sub in submissions:
        date = sub["created_at"][:10]
        if date not in activity:
            activity[date] = {"total": 0, "accepted": 0}
        activity[date]["total"] += 1
        if sub["verdict"] == "Accepted":
            activity[date]["accepted"] += 1
    
    # Calculate streak
    streak = 0
    max_streak = 0
    today = datetime.now(timezone.utc).date()
    check_date = today
    
    while True:
        date_str = check_date.strftime("%Y-%m-%d")
        if date_str in activity:
            streak += 1
            max_streak = max(max_streak, streak)
            check_date -= timedelta(days=1)
        else:
            break
    
    return {
        "activity": activity,
        "current_streak": streak,
        "max_streak": max_streak,
        "total_active_days": len(activity),
        "total_submissions": sum(d["total"] for d in activity.values()),
        "total_accepted": sum(d["accepted"] for d in activity.values())
    }

# ───────────────────────────────────────────────
# PAIR PROGRAMMING
# ───────────────────────────────────────────────
pair_mgr = PairRoomManager()

@api_router.post("/pair/create")
async def create_pair_room(current_user: dict = Depends(get_current_user)):
    room = pair_mgr.create_room(current_user["id"], current_user["username"])
    return room

class JoinRoomRequest(BaseModel):
    room_id: str

@api_router.post("/pair/join")
async def join_pair_room(req: JoinRoomRequest, current_user: dict = Depends(get_current_user)):
    try:
        room = pair_mgr.join_room(req.room_id, current_user["id"], current_user["username"])
        # Broadcast user_joined to everyone already in the room
        await pair_mgr.broadcast(room["room_id"], {
            "type": "user_joined",
            "username": current_user["username"],
            "participants": room["participants"]
        })
        return room
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/pair/room/{room_id}")
async def get_pair_room(room_id: str, current_user: dict = Depends(get_current_user)):
    room = pair_mgr.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@app.websocket("/api/ws/pair/{room_id}")
async def pair_ws(ws: WebSocket, room_id: str):
    await ws.accept()
    pair_mgr.add_ws(room_id, ws)
    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)
            msg_type = data.get("type")

            if msg_type == "code_update":
                pair_mgr.update_code(room_id, data.get("code", ""), data.get("language"))
                await pair_mgr.broadcast(room_id, {
                    "type": "code_update",
                    "code": data.get("code", ""),
                    "language": data.get("language"),
                    "sender": data.get("sender", "")
                }, exclude=ws)

            elif msg_type == "chat_message":
                msg = pair_mgr.add_message(
                    room_id,
                    data.get("user_id", ""),
                    data.get("username", ""),
                    data.get("text", "")
                )
                await pair_mgr.broadcast(room_id, {
                    "type": "chat_message",
                    "message": msg
                })

            elif msg_type == "problem_select":
                problem_id = data.get("problem_id")
                if problem_id:
                    prob = await db.problems.find_one({"id": problem_id})
                    if prob:
                        prob.pop("_id", None)
                        pair_mgr.set_problem(room_id, problem_id, prob)
                        await pair_mgr.broadcast(room_id, {
                            "type": "problem_selected",
                            "problem": prob
                        })

            elif msg_type == "language_change":
                pair_mgr.update_code(room_id, data.get("code", ""), data.get("language", "python"))
                await pair_mgr.broadcast(room_id, {
                    "type": "language_change",
                    "language": data.get("language", "python"),
                    "sender": data.get("sender", "")
                }, exclude=ws)

    except WebSocketDisconnect:
        pair_mgr.remove_ws(room_id, ws)
        # Notify others
        room = pair_mgr.get_room(room_id)
        if room:
            await pair_mgr.broadcast(room_id, {
                "type": "user_left",
                "participants": room["participants"]
            })
    except Exception:
        pair_mgr.remove_ws(room_id, ws)

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
