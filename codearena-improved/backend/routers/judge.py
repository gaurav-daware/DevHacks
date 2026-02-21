from flask import Blueprint, request, jsonify
from schemas.models import SubmitRequest, SubmitResponse
from services.judge0 import run_all_tests
import asyncio
import json

bp = Blueprint("judge", __name__, url_prefix="/judge")


def _run_async(coro):
    """Run async function in synchronous context."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


@bp.route("/submit", methods=["POST"])
def submit_code():
    """
    Relay code submission to Judge0 and aggregate test case results.
    """
    data = request.get_json()
    
    print(f"[BACKEND] /judge/submit request received - problem_id: {data.get('problem_id')}, language: {data.get('language')}")
    
    # Validate input
    if not data.get("test_cases"):
        print("[BACKEND] ERROR: No test cases provided")
        return jsonify({"error": "No test cases provided"}), 400
    
    # Extract fields
    test_cases = data.get("test_cases", [])
    code = data.get("code", "")
    language = data.get("language", "python")
    time_limit = data.get("time_limit", 2000)
    memory_limit = data.get("memory_limit", 256)
    
    # Parse test cases
    parsed_test_cases = []
    for tc in test_cases:
        if isinstance(tc, dict):
            parsed_test_cases.append(tc)
        else:
            try:
                parsed_test_cases.append(json.loads(tc) if isinstance(tc, str) else dict(tc))
            except Exception:
                continue
    
    if not parsed_test_cases:
        print("[BACKEND] ERROR: Invalid test cases format")
        return jsonify({"error": "Invalid test cases format"}), 400
    
    print(f"[BACKEND] Running {len(parsed_test_cases)} test cases with {language} code ({len(code)} chars)")
    
    # Run tests asynchronously
    try:
        result = _run_async(run_all_tests(
            source_code=code,
            language=language,
            test_cases=parsed_test_cases,
            time_limit=time_limit,
            memory_limit=memory_limit,
        ))
        
        print(f"[BACKEND] Test results: {result['status']} ({result['tests_passed']}/{result['total_tests']} passed)")
        return jsonify(result), 200
    except Exception as e:
        print(f"[BACKEND] ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500


@bp.route("/languages", methods=["GET"])
def get_languages():
    """Get supported language IDs for Judge0."""
    return jsonify({
        "python": {"id": 71, "name": "Python 3.8.1"},
        "cpp": {"id": 54, "name": "C++ (GCC 9.2.0)"},
        "java": {"id": 62, "name": "Java (OpenJDK 13.0.1)"},
        "javascript": {"id": 63, "name": "JavaScript (Node.js 12.14.0)"},
    }), 200

