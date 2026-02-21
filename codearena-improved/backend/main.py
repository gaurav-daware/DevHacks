from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from routers import duels, judge, ai
from core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 CodeArena AI Backend starting...")
    print(f"   Judge0 URL: {settings.JUDGE0_URL}")
    yield
    print("👋 CodeArena AI Backend shutting down...")


app = FastAPI(
    title="CodeArena AI API",
    description="Real-time competitive programming platform",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend:3000",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(duels.router, prefix="/duels", tags=["duels"])
app.include_router(judge.router, prefix="/judge", tags=["judge"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "CodeArena AI v2"}


@app.get("/")
async def root():
    return {"message": "CodeArena AI Backend v2", "docs": "/docs"}
