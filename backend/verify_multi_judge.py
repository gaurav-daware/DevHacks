import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent))
from judge import CodeRunner

async def run_tests():
    judge = CodeRunner()
    print("Starting Multi-Language Judge Verification...\n")
    
    test_cases = [
        {
            "lang": "python",
            "name": "Python: Basic Add",
            "code": "print(sum(map(int, input().split())))",
            "input": "10 20",
            "expected": "30",
            "expect_verdict": "Accepted"
        },
        {
            "lang": "cpp",
            "name": "C++: Basic Add",
            "code": "#include <iostream>\nint main() { int a, b; std::cin >> a >> b; std::cout << a + b; return 0; }",
            "input": "5 7",
            "expected": "12",
            "expect_verdict": "Accepted"
        },
        {
            "lang": "javascript",
            "name": "Node.js: Basic Add",
            "code": "const fs = require('fs'); const input = fs.readFileSync(0, 'utf8'); const [a, b] = input.split(' ').map(Number); console.log(a + b);",
            "input": "8 2",
            "expected": "10",
            "expect_verdict": "Accepted"
        },
        {
            "lang": "python",
            "name": "Python: TLE",
            "code": "import time\nwhile True: pass",
            "input": "",
            "expected": "error",
            "expect_verdict": "Time Limit Exceeded",
            "timeout": 1.0
        },
        {
            "lang": "cpp",
            "name": "C++: Compilation Error",
            "code": "int main() { return 0 }", # Missing semicolon
            "input": "",
            "expected": "",
            "expect_verdict": "Compilation Error"
        }
    ]

    for tc in test_cases:
        print(f"Testing {tc['name']}...")
        result = await judge.execute(
            tc['code'], 
            tc['lang'], 
            tc['input'], 
            tc['expected'], 
            tc.get('timeout', 2.0)
        )
        passed = result.verdict == tc['expect_verdict']
        status = "[PASS]" if passed else "[FAIL]"
        print(f"  {status} | Verdict: {result.verdict} | Time: {result.time}s")
        if not passed:
            print(f"  Expected: {tc['expect_verdict']}, Got: {result.verdict}")
            print(f"  Output: {result.output}\n")
    
    print("\nVerification Complete.")

if __name__ == "__main__":
    asyncio.run(run_tests())
