# ⚡ CodeArena AI

> Real-time competitive programming platform with 1v1 duels, AI mentoring, and collaborative coding.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/UI |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Backend | FastAPI (Python), WebSockets |
| Database | MongoDB Atlas (via Prisma ORM) |
| Auth | NextAuth.js (Google + GitHub) |
| Execution | Judge0 (self-hosted via Docker) |
| AI | Google Gemini API (Socratic mentor) |
| Real-time | WebSockets (FastAPI) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

### 1. Clone & Configure

```bash
git clone <repo>
cd codearena-ai
cp .env.example .env
# Fill in your values in .env
```

### 2. Start Judge0 (code execution engine)

```bash
docker-compose up judge0-server judge0-workers judge0-db judge0-redis -d
```

Wait ~30 seconds for Judge0 to initialize, then verify:
```bash
curl http://localhost:2358/system_info
```

### 3. Start the Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 4. Start the Frontend (Next.js)

```bash
cd frontend
npm install
npx prisma generate
npx prisma db push        # Push schema to MongoDB
npx ts-node prisma/seed.ts  # Seed 8 problems
npm run dev
```

App: http://localhost:3000

---

## 🗂️ Project Structure

```
codearena-ai/
├── frontend/                    # Next.js 15 App
│   ├── app/
│   │   ├── (auth)/login/        # OAuth login page
│   │   ├── practice/            # Problem list + solver
│   │   ├── duel/[id]/           # Real-time 1v1 arena
│   │   ├── dashboard/           # Dev-Tree + profile
│   │   └── api/                 # API routes
│   ├── components/
│   │   ├── editor/              # Monaco + AI Chat
│   │   ├── dev-tree/            # Skill tree SVG
│   │   └── layout/              # Navbar, Providers
│   ├── hooks/                   # useWebSocket, useTimer
│   ├── lib/                     # prisma.ts, utils.ts
│   └── prisma/                  # Schema + seed
│
├── backend/                     # FastAPI
│   ├── main.py                  # Entry + CORS
│   ├── core/config.py           # Settings (pydantic)
│   ├── routers/
│   │   ├── duels.py             # WebSocket + matchmaking
│   │   ├── judge.py             # Judge0 relay
│   │   └── ai.py                # Gemini Socratic AI
│   ├── services/
│   │   ├── judge0.py            # HTTP client for Judge0
│   │   └── matchmaking.py       # In-memory queue
│   └── schemas/models.py        # Pydantic models
│
└── docker-compose.yml           # Judge0 + services
```

---

## ⚔️ Features

### Problems
- 8 seeded problems (Easy/Medium/Hard)
- Filter by difficulty, tag, search
- Acceptance rate tracking
- Solved status per user

### Code Execution
- Supports Python 3, C++17, Java 11, JavaScript (Node.js)
- All test cases run via Judge0
- Runtime + memory tracking

### 1v1 Duel
- Real-time matchmaking by ELO
- WebSocket health bars (test case %)
- ELO rating changes on win/loss
- Winner detection broadcast

### 🤖 AI Socratic Mentor
- Powered by Google Gemini 1.5 Flash
- Never gives direct answers
- Guides with questions about edge cases, complexity, logic
- Fallback hints if API unavailable

### 🌳 Dev-Tree (Skill Progression)
- SVG skill graph with prerequisites
- Nodes unlock when 3+ problems solved per tag
- Visual progress bars per skill
- XP-gated unlocks

### Dashboard
- GitHub-style contribution heatmap
- Submission history
- Duel history with win/loss
- Rating, XP, streak tracking

---

## 🔑 Environment Variables

### Frontend (`frontend/.env.local`)
```
DATABASE_URL="mongodb+srv://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_ID="..."
GITHUB_SECRET="..."
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_WS_URL="ws://localhost:8000"
```

### Backend (`backend/.env`)
```
DATABASE_URL="mongodb+srv://..."
GEMINI_API_KEY="your-gemini-key"
JUDGE0_URL="http://localhost:2358"
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="http://localhost:3000"
```

---

## 🐛 Troubleshooting

**Judge0 not accepting submissions?**
```bash
docker logs codearena-ai-judge0-server-1
# Wait for "Listening on 0.0.0.0:2358"
```

**Prisma can't connect?**
- Check your MongoDB Atlas IP whitelist (add 0.0.0.0/0 for dev)
- Verify DATABASE_URL format

**WebSocket disconnects?**
- Check `NEXT_PUBLIC_WS_URL=ws://localhost:8000`
- Ensure FastAPI backend is running

**Gemini AI not responding?**
- Get API key: https://aistudio.google.com/app/apikey
- Add to `backend/.env`: `GEMINI_API_KEY="your-key"`
- Fallback hints work without it

---

## 📦 Adding More Problems

Edit `frontend/prisma/seed.ts` and add objects to the `problems` array following the same schema, then re-run:
```bash
npx ts-node prisma/seed.ts
```
