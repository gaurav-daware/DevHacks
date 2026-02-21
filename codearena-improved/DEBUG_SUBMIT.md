# Submit Button Debugging Guide

## Issues Fixed ✅

1. **Enhanced Error Logging**: Added detailed console logs in frontend and backend to trace the submission flow
2. **Better Error Messages**: Frontend now shows specific error messages instead of silently failing
3. **Backend Logging**: Added logging to `/judge/submit` endpoint and Judge0 service to track execution

## How to Debug the Issue

### Step 1: Open Developer Console
- Press `F12` or `Ctrl+Shift+I` in your browser
- Go to **Console** tab
- Look for messages starting with:
  - `[/api/submit]` - Frontend Next.js API calls
  - `[BACKEND]` - Backend Python logs
  - `[JUDGE0]` - Judge0 service calls

### Step 2: Check the Submission Flow

When you click "Run" or "Submit", you should see this flow in console:

```
1. Browser Console:
   "Submitting code to /api/submit"
   
2. Browser Console:
   "Submit response received:" (with result object)
   
3. Server Logs (uvicorn):
   "[/api/submit] Request received"
   "[/api/submit] Found problem, calling backend"
   "[BACKEND] /judge/submit request received"
   "[JUDGE0] Executing python at http://localhost:2358/submissions?wait=true"
   "[BACKEND] Test results: Accepted (5/5 passed)"
```

### Step 3: Common Issues & Solutions

#### ❌ Error: "Unauthorized - no session"
**Problem**: User is not logged in
**Solution**: Sign in with GitHub or Google first

#### ❌ Error: "Problem not found"
**Problem**: The problem slug doesn't exist in database
**Solution**: Check if you're using the correct problem URL

#### ❌ Error: "API returned 500: Execution failed"
**Problem**: Backend couldn't call Judge0
**Solution**: 
- Check if Judge0 is running: `docker ps | grep judge0`
- Check if backend is running: Check for `[BACKEND]` logs

#### ❌ Error: "Judge0 service unavailable at http://localhost:2358"
**Problem**: Judge0 Docker container is not running or not accessible
**Solution**:
```bash
# Check if Judge0 is running
docker ps | grep judge0

# If not running, start it
docker-compose up judge0-server judge0-workers judge0-db judge0-redis -d

# Wait 30 seconds for initialization
# Check if it's ready
curl http://localhost:2358/system_info
```

#### ❌ No logs appearing at all
**Problem**: The API call might not be reaching the server
**Solution**:
- Check `NEXT_PUBLIC_BACKEND_URL` environment variable
- In Next.js, it should be `http://localhost:8000` (local development)
- Run: `echo $NEXT_PUBLIC_BACKEND_URL` in your terminal

### Step 4: Environment Setup

#### Frontend (.env.local or set in next.config.js)
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

#### Backend (.env)
```
DATABASE_URL=mongodb://localhost:27017/codearena
JUDGE0_URL=http://localhost:2358
REDIS_URL=redis://localhost:6379
```

### Step 5: Verify Services Are Running

```bash
# Check if backend is running on port 8000
curl http://localhost:8000/health
# Should return: {"status":"ok","service":"CodeArena AI v2"}

# Check if Judge0 is ready
curl http://localhost:2358/system_info
# Should return system information

# Check if frontend is running on port 3000
curl http://localhost:3000
# Should return HTML
```

## Complete Service Startup Guide

### Option 1: Using Docker (Recommended)
```bash
cd codearena-improved
docker-compose up -d
```

### Option 2: Local Development

**Terminal 1 - Backend (FastAPI)**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend (Next.js)**
```bash
cd frontend
npm install
npm run dev
# This runs on http://localhost:3000
```

**Terminal 3 - Judge0 (Docker only)**
```bash
docker-compose up judge0-server judge0-workers judge0-db judge0-redis -d
```

## Testing the Submit Flow

### Using cURL to test backend directly:
```bash
curl -X POST http://localhost:8000/judge/submit \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": "4",
    "code": "print(\"hello\")",
    "language": "python",
    "test_cases": [{"input": "", "output": "hello"}],
    "time_limit": 2000,
    "memory_limit": 256
  }'
```

## Logs to Check

### Browser Console (F12)
Look for submission-related messages

### Backend Terminal
Run backend with: `uvicorn main:app --reload --port 8000`
Watch for `[BACKEND]` and `[JUDGE0]` messages

### Docker Logs
```bash
# Backend logs
docker logs codearena-improved-backend-1 -f

# Judge0 server logs
docker logs codearena-improved-judge0-server-1 -f
```

## If Still Not Working

1. Open DevTools (F12) → Console tab
2. Click "Run" or "Submit" button
3. Copy the **entire console output**
4. Check the **Network tab** for the `/api/submit` request
5. Check if the request shows:
   - ✅ Status 200 = Success!
   - ❌ Status 401 = Not logged in
   - ❌ Status 404 = Problem not found
   - ❌ Status 500 = Server error (check server logs)
