# CodeArena PRD - AI-Assisted Competitive Programming Platform

## Original Problem Statement
Build a web application called "CodeArena" – an AI-assisted competitive programming platform with user auth, problem management, practice mode, contest mode, real-time leaderboard, code execution, AI hints, and code playback.

## Architecture

### Tech Stack
- **Frontend**: React + Tailwind CSS + Monaco Editor + React Router + Framer Motion
- **Backend**: FastAPI (Python) + MongoDB (Motor async driver)
- **Auth**: JWT (python-jose)
- **AI**: Gemini via emergentintegrations (gemini-3-flash-preview)
- **Real-Time**: FastAPI WebSockets
- **Code Execution**: Python subprocess (real), C++/JS mocked

### Key Design Decisions
- Dark "Neon Operator" theme (Space Grotesk + Inter + JetBrains Mono fonts)
- Electric green (#22c55e) primary accent
- Mock execution engine: Python code runs via subprocess, C++ and JS return simulated Accepted
- WebSocket-based real-time leaderboard per contest room
- Keystroke recording in Monaco editor for code playback feature

## Database Schemas

### Users
```json
{ "id": uuid, "username": str, "email": str, "password_hash": str, "role": "user|admin", "solved_problems": [problem_id], "contest_history": [], "created_at": ISO }
```

### Problems
```json
{ "id": uuid, "title": str, "description": markdown, "difficulty": "easy|medium|hard", "tags": [str], "sample_input": str, "sample_output": str, "test_cases": [{input, output}], "hints": [str], "constraints": str, "time_limit": int, "solved_count": int }
```

### Contests
```json
{ "id": uuid, "title": str, "problem_ids": [uuid], "duration": int(min), "join_code": str(6char), "start_time": ISO, "end_time": ISO, "status": "active|ended", "participants": [user_id] }
```

### Submissions
```json
{ "id": uuid, "user_id": str, "problem_id": str, "contest_id": str|null, "language": str, "code": str, "verdict": str, "execution_time": float, "test_results": [{}], "keystrokes": [{timestamp, value}] }
```

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Problems
- GET /api/problems (with ?difficulty=&tag= filters)
- GET /api/problems/{id}
- POST /api/problems (admin only)
- PUT /api/problems/{id} (admin only)
- DELETE /api/problems/{id} (admin only)
- POST /api/problems/{id}/hint (Gemini AI)

### Contests
- GET /api/contests
- GET /api/contests/{id}
- POST /api/contests (admin only)
- POST /api/contests/join
- GET /api/contests/{id}/leaderboard
- DELETE /api/contests/{id} (admin only)

### Submissions
- POST /api/submit
- GET /api/submissions/problem/{id}
- GET /api/submissions/{id}
- GET /api/submissions/{id}/playback

### Users
- GET /api/users/profile (self)
- GET /api/users/{id}/profile

### Admin
- GET /api/admin/stats

### WebSocket
- WS /api/ws/contest/{contest_id} (real-time leaderboard)

## What's Been Implemented (2026-02-21)

### Core Features ✅
1. **User Authentication** - Register, login, JWT (7-day tokens), user profile
2. **Problem Management** - Full CRUD (admin), 5 seeded sample problems, difficulty/tag filters
3. **Practice Mode** - Monaco Editor, Python/C++/JS selector, submit, test case verdicts
4. **Contest Mode** - Create with duration + problems, 6-char join code, join via code
5. **Real-Time Leaderboard** - WebSocket per contest room, ICPC-style penalty scoring
6. **Code Execution** - Python: real subprocess execution; C++/JS: mocked (always Accepted)
7. **AI Hints** - 3-level hints via Gemini (gemini-3-flash-preview), falls back to static hints
8. **Code Playback** - Keystroke recording in Monaco, replay with Play/Pause/Speed controls
9. **Admin Dashboard** - Stats overview, problem CRUD modals, contest creation with code display

### Frontend Pages
- `/` - Landing page (hero + features grid + CTA)
- `/auth` - Login/Register tabs
- `/problems` - Problem list with search/filters/solved badges
- `/problems/:id` - Split-screen Monaco editor + description/hints/submissions tabs
- `/contests` - Contest list + join-by-code modal
- `/contests/:id` - Contest arena (timer + editor + live leaderboard + problem list)
- `/admin` - Admin dashboard (stats, problems tab, contests tab)
- `/profile` - User profile (stats, recent submissions, solved problems)

### Seeded Data
- Admin: admin@codearena.com / Admin@123
- 5 problems: Two Sum (easy), Fibonacci (easy), Valid Parentheses (medium), Maximum Subarray (medium), Palindrome Check (easy)

## Prioritized Backlog

### P0 - Critical (Next Phase)
- [ ] Real C++/JavaScript execution (integrate Judge0 API when available)
- [ ] Contest status management (active → ended based on timer)

### P1 - Important
- [ ] Problem search by full-text
- [ ] Contest leaderboard historical view
- [ ] Code editor templates per problem
- [ ] User rankings/global leaderboard
- [ ] Email verification

### P2 - Nice-to-Have
- [ ] Discussion/editorial section per problem
- [ ] Problem difficulty rating by users
- [ ] Multiple admin roles
- [ ] Contest registration (pre-join before start)
- [ ] Submission diff viewer
- [ ] Code sharing feature
