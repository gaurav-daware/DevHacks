import httpx
import asyncio
import base64
from typing import Any, Dict, Optional, List
from core.config import settings

# Judge0 language IDs
LANGUAGE_IDS = {
    "python": 71,       # Python 3.8.1
    "cpp": 54,          # C++ (GCC 9.2.0)
    "java": 62,         # Java (OpenJDK 13.0.1)
    "javascript": 63,   # JavaScript (Node.js 12.14.0)
}


async def run_single(
    source_code: str,
    language: str,
    stdin: str = "",
    time_limit: float = 2.0,
    memory_limit: int = 262144,  # KB
) -> Dict[str, Any]:
    """Run a single test case through Judge0."""
    language_id = LANGUAGE_IDS.get(language, 71)

    payload = {
        "source_code": base64.b64encode(source_code.encode()).decode(),
        "language_id": language_id,
        "stdin": base64.b64encode(stdin.encode()).decode() if stdin else "",
        "cpu_time_limit": time_limit,
        "memory_limit": memory_limit,
        "enable_base64": True,
    }

    url = f"{settings.JUDGE0_URL}/submissions?wait=true"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()

            # Decode base64 outputs
            stdout = ""
            stderr = ""
            if data.get("stdout"):
                stdout = base64.b64decode(data["stdout"]).decode("utf-8", errors="replace").strip()
            if data.get("stderr"):
                stderr = base64.b64decode(data["stderr"]).decode("utf-8", errors="replace").strip()
            if data.get("compile_output"):
                compile_out = base64.b64decode(data["compile_output"]).decode("utf-8", errors="replace").strip()
                if compile_out:
                    stderr = compile_out + "\n" + stderr

            return {
                "stdout": stdout,
                "stderr": stderr,
                "status_id": data.get("status", {}).get("id", 0),
                "status": data.get("status", {}).get("description", "Unknown"),
                "time": data.get("time"),
                "memory": data.get("memory"),
            }
        except httpx.ConnectError:
            return {
                "stdout": "",
                "stderr": "Judge0 service unavailable. Make sure Docker is running on port 2358.",
                "status_id": -1,
                "status": "Service Unavailable",
                "time": None,
                "memory": None,
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": str(e),
                "status_id": -1,
                "status": "Error",
                "time": None,
                "memory": None,
            }


async def run_all_tests(
    source_code: str,
    language: str,
    test_cases: List[Dict],
    time_limit: int = 2000,
    memory_limit: int = 256,
) -> Dict[str, Any]:
    """
    Run all test cases concurrently and aggregate results.
    Returns structured result similar to LeetCode.
    """
    tasks = [
        run_single(
            source_code=source_code,
            language=language,
            stdin=tc.get("input", ""),
            time_limit=time_limit / 1000,
            memory_limit=memory_limit * 1024,
        )
        for tc in test_cases
    ]

    results = await asyncio.gather(*tasks)

    test_results = []
    tests_passed = 0
    first_error = ""
    total_time_ms = 0
    max_memory_kb = 0

    for i, (tc, result) in enumerate(zip(test_cases, results)):
        expected = str(tc.get("output", "")).strip()
        actual = result["stdout"].strip()
        status_id = result["status_id"]

        # Status ID reference:
        # 3 = Accepted
        # 4 = Wrong Answer
        # 5 = Time Limit Exceeded
        # 6 = Compilation Error
        # 11 = Runtime Error

        if status_id == 3 and actual == expected:
            test_status = "pass"
            tests_passed += 1
        elif status_id == 5:
            test_status = "fail"
            if not first_error:
                first_error = "Time Limit Exceeded"
        elif status_id in [6]:
            test_status = "fail"
            if not first_error:
                first_error = result["stderr"]
        elif status_id in [11, 12]:
            test_status = "fail"
            if not first_error:
                first_error = result["stderr"]
        else:
            test_status = "fail"
            if not first_error and result["stderr"]:
                first_error = result["stderr"]

        try:
            if result["time"]:
                total_time_ms += float(result["time"]) * 1000
            if result["memory"]:
                max_memory_kb = max(max_memory_kb, int(result["memory"]))
        except (TypeError, ValueError):
            pass

        test_results.append({
            "input": tc.get("input", ""),
            "expected": expected,
            "output": actual,
            "status": test_status,
            "runtime": f"{int(float(result['time']) * 1000)}ms" if result["time"] else None,
            "memory": f"{round(max_memory_kb / 1024, 1)}MB" if max_memory_kb else None,
            "error": result["stderr"] if test_status == "fail" else None,
        })

    # Determine final status
    all_passed = tests_passed == len(test_cases)

    if first_error and "Time Limit" in first_error:
        final_status = "Time Limit Exceeded"
    elif first_error and ("error" in first_error.lower() or "Error" in first_error):
        if "Compilation" in first_error or "SyntaxError" in first_error:
            final_status = "Compilation Error"
        else:
            final_status = "Runtime Error"
    elif not all_passed:
        final_status = "Wrong Answer"
    else:
        final_status = "Accepted"

    avg_runtime = f"{int(total_time_ms / len(test_cases))}ms" if test_cases else "0ms"
    memory_str = f"{round(max_memory_kb / 1024, 1)}MB" if max_memory_kb else "N/A"

    return {
        "status": final_status,
        "tests_passed": tests_passed,
        "total_tests": len(test_cases),
        "results": test_results,
        "runtime": avg_runtime,
        "memory": memory_str,
        "error_output": first_error,
    }
