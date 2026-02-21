from dataclasses import dataclass
from typing import List, Optional, Dict

@dataclass
class LanguageConfig:
    name: str
    extension: str
    compile_cmd: Optional[List[str]] = None
    run_cmd: List[str] = None
    interpreted: bool = True

LANGUAGES: Dict[str, LanguageConfig] = {
    "python": LanguageConfig(
        name="python",
        extension=".py",
        run_cmd=["python"],
        interpreted=True
    ),
    "cpp": LanguageConfig(
        name="cpp",
        extension=".cpp",
        compile_cmd=["g++", "-O3", "-std=c++17", "{src}", "-o", "{bin}"],
        run_cmd=["{bin}"],
        interpreted=False
    ),
    "javascript": LanguageConfig(
        name="javascript",
        extension=".js",
        run_cmd=["node"],
        interpreted=True
    )
}
