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
                
                comp_proc = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await comp_proc.communicate()
                
                if comp_proc.returncode != 0:
                    return CodeExecutionResult(
                        "Compilation Error", 
                        stderr.decode().strip()[:500], 
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

            t0 = asyncio.get_event_loop().time()
            proc = await asyncio.create_subprocess_exec(
                *run_cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            try:
                stdout, stderr = await asyncio.wait_for(
                    proc.communicate(input=test_input.encode()),
                    timeout=time_limit
                )
                elapsed = round(asyncio.get_event_loop().time() - t0, 3)
                
                stdout_str = stdout.decode().strip()
                stderr_str = stderr.decode().strip()

                if proc.returncode != 0:
                    return CodeExecutionResult(
                        "Runtime Error",
                        stderr_str[:500] if stderr_str else f"Exit code {proc.returncode}",
                        elapsed,
                        False,
                        exit_code=proc.returncode
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

            except (asyncio.TimeoutError, asyncio.exceptions.TimeoutError):
                try:
                    proc.kill()
                    await proc.wait()
                except Exception:
                    pass
                return CodeExecutionResult("Time Limit Exceeded", "Execution timed out", time_limit, False)

        except Exception as e:
            return CodeExecutionResult("System Error", str(e)[:200], 0, False)
        finally:
            # 3. Cleanup
            await cleanup_path(job_dir)
