import asyncio
import os
import shutil
from pathlib import Path

def normalize_output(text: str) -> str:
    """Standardizes output by removing trailing whitespace and handling line endings."""
    if not text:
        return ""
    lines = [line.rstrip() for line in text.strip().splitlines()]
    return "\n".join(lines)

async def cleanup_path(path: Path):
    """Safely removes a file or directory."""
    try:
        if path.is_file():
            path.unlink(missing_ok=True)
        elif path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
    except Exception:
        pass
