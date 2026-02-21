from fastapi import APIRouter, HTTPException
from schemas.models import SubmitRequest, SubmitResponse
from services.judge0 import run_all_tests

router = APIRouter()


@router.post("/submit", response_model=SubmitResponse)
async def submit_code(req: SubmitRequest):
    """
    Relay code submission to Judge0 and aggregate test case results.
    """
    if not req.test_cases:
        raise HTTPException(status_code=400, detail="No test cases provided")

    # Parse test cases from JSON stored in DB
    test_cases = []
    for tc in req.test_cases:
        if isinstance(tc, dict):
            test_cases.append(tc)
        else:
            try:
                test_cases.append(dict(tc))
            except Exception:
                continue

    if not test_cases:
        raise HTTPException(status_code=400, detail="Invalid test cases format")

    result = await run_all_tests(
        source_code=req.code,
        language=req.language.value,
        test_cases=test_cases,
        time_limit=req.time_limit,
        memory_limit=req.memory_limit,
    )

    return SubmitResponse(**result)


@router.get("/languages")
async def get_languages():
    """Get supported language IDs for Judge0."""
    return {
        "python": {"id": 71, "name": "Python 3.8.1"},
        "cpp": {"id": 54, "name": "C++ (GCC 9.2.0)"},
        "java": {"id": 62, "name": "Java (OpenJDK 13.0.1)"},
        "javascript": {"id": 63, "name": "JavaScript (Node.js 12.14.0)"},
    }
