import asyncio
import os
import uuid
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

from .language_config import LANGUAGES, LanguageConfig
from .utils import normalize_output, cleanup_path

@dataclass
class CodeExecutionResult:
    verdict: str
    output: str
    time: float
    passed: bool
    expected: Optional[str] = None
    exit_code: Optional[int] = None

class CodeRunner:
    def __init__(self, workspace_root: str = "temp_exec"):
        self.workspace_root = Path(workspace_root)
        self.workspace_root.mkdir(exist_ok=True)

    async def execute(
        self, 
        code: str, 
        language: str, 
        test_input: str, 
        expected: str, 
        time_limit: float = 2.0
    ) -> CodeExecutionResult:
        if language not in LANGUAGES:
            return CodeExecutionResult("System Error", f"Unsupported language: {language}", 0, False)

        config = LANGUAGES[language]
        job_id = uuid.uuid4().hex
        job_dir = self.workspace_root / job_id
        job_dir.mkdir()

        src_file = job_dir / f"solution{config.extension}"
        with open(src_file, "w", encoding="utf-8") as f:
            f.write(code)

        try:
            # 1. Compilation Stage
            bin_path = str(job_dir / "solution.bin")
            if config.compile_cmd:
                # Replace placeholders
                cmd = [c.replace("{src}", str(src_file)).replace("{bin}", bin_path) for c in config.compile_cmd]
                import subprocess
                def run_compile():
                    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                
                comp_res = await asyncio.to_thread(run_compile)
                
                if comp_res.returncode != 0:
                    return CodeExecutionResult(
                        "Compilation Error", 
                        comp_res.stderr.decode().strip()[:500], 
                        0, 
                        False
                    )

            # 2. Execution Stage
            run_cmd = []
            for c in config.run_cmd:
                if c == "{bin}":
                    run_cmd.append(bin_path)
                elif config.name == "python" and c == "python":
                    import sys
                    run_cmd.append(sys.executable)
                else:
                    run_cmd.append(c)
            
            if config.interpreted:
                run_cmd.append(str(src_file))

            import subprocess
            import time
            def run_exec():
                return subprocess.run(
                    run_cmd,
                    input=test_input.encode(),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=time_limit
                )

            t0 = time.time()
            try:
                res = await asyncio.to_thread(run_exec)
                elapsed = round(time.time() - t0, 3)
                
                stdout_str = res.stdout.decode().strip()
                stderr_str = res.stderr.decode().strip()

                if res.returncode != 0:
                    return CodeExecutionResult(
                        "Runtime Error",
                        stderr_str[:500] if stderr_str else f"Exit code {res.returncode}",
                        elapsed,
                        False,
                        exit_code=res.returncode
                    )

                norm_actual = normalize_output(stdout_str)
                norm_expected = normalize_output(expected)

                if norm_actual == norm_expected:
                    return CodeExecutionResult("Accepted", stdout_str[:200], elapsed, True)
                else:
                    return CodeExecutionResult(
                        "Wrong Answer", 
                        stdout_str[:200], 
                        elapsed, 
                        False, 
                        expected=expected.strip()[:200]
                    )

            except subprocess.TimeoutExpired:
                return CodeExecutionResult("Time Limit Exceeded", "Execution timed out", time_limit, False)

        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            with open("crash_log.txt", "w") as f:
                f.write(f"Exception Type: {type(e)}\n")
                f.write(f"Exception Str: {repr(str(e))}\n")
                f.write(f"Traceback:\n{tb}\n")
                
            return CodeExecutionResult("System Error", str(e)[:200], 0, False)
        finally:
            # 3. Cleanup
            await cleanup_path(job_dir)
