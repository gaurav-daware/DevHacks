import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load env from parent dir
load_dotenv(Path(__file__).parent / ".env")

# Direct imports from seed files
from problems_data import get_all_problems

async def seed():
    mongo_url = os.getenv('MONGO_URL')
    db_name = os.getenv('DB_NAME', 'codearena')
    
    print(f"Connecting to {db_name}...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    problems = get_all_problems()
    
    # Drop existing problems and re-seed
    await db.problems.delete_many({})
    result = await db.problems.insert_many(problems)
    
    print(f"Successfully seeded {len(result.inserted_ids)} problems.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
