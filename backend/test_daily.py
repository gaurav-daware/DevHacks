import asyncio
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

# The server initialization has seed_data() on startup
# which might be needed, but TestClient handles it optionally.
# However, running the client should give us the traceback.
try:
    response = client.get("/api/daily-challenge")
    print(response.status_code)
    print(response.json())
except Exception as e:
    import traceback
    traceback.print_exc()
