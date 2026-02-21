import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))
from judge import CodeRunner

async def run_tests():
    judge = CodeRunner()
    print("Starting LeetCode-Style Execution Verification...\n")
    
    # Metadata for Two Sum
    metadata = {
        "method_name": "twoSum",
        "args": [
            {"name": "nums", "type": "List[int]"},
            {"name": "target", "type": "int"}
        ]
    }

    test_cases = [
        {
            "lang": "python",
            "name": "Python: Two Sum",
            "code": """class Solution:\n    def twoSum(self, nums, target):\n        prevMap = {}\n        for i, n in enumerate(nums):\n            diff = target - n\n            if diff in prevMap:\n                return [prevMap[diff], i]\n            prevMap[n] = i\n        return []""",
            "input": "[2,7,11,15]\\n9",
            "expected": "0 1",
            "expect_verdict": "Accepted"
        },
        {
            "lang": "javascript",
            "name": "Node.js: Two Sum",
            "code": """class Solution {\n    twoSum(nums, target) {\n        let map = new Map();\n        for (let i = 0; i < nums.length; i++) {\n            let diff = target - nums[i];\n            if (map.has(diff)) return [map.get(diff), i];\n            map.set(nums[i], i);\n        }\n        return [];\n    }\n}""",
            "input": "[3,2,4]\\n6",
            "expected": "1 2",
            "expect_verdict": "Accepted"
        },
        {
            "lang": "cpp",
            "name": "C++: Two Sum (Full Program Mode)",
            "code": """#include <iostream>\n#include <vector>\nint main() { std::cout << "0 1"; return 0; }""",
            "input": "",
            "expected": "0 1",
            "expect_verdict": "Accepted",
            "mode": "full_program"
        }
    ]

    for tc in test_cases:
        mode = tc.get("mode", "leetcode_function")
        print(f"Testing {tc['name']} ({mode})...")
        result = await judge.execute(
            tc['code'], 
            tc['lang'], 
            tc['input'], 
            tc['expected'], 
            2.0,
            mode,
            metadata
        )
        passed = result.verdict == tc['expect_verdict']
        status = "[PASS]" if passed else "[FAIL]"
        print(f"  {status} | Verdict: {result.verdict} | Time: {result.time}s")
        if not passed:
            print(f"  Expected: {tc['expect_verdict']}, Got: {result.verdict}")
            print(f"  Output: {result.output}\\n")
    
    print("\nVerification Complete.")

if __name__ == "__main__":
    asyncio.run(run_tests())
