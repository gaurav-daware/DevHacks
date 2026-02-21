from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum


class LanguageEnum(str, Enum):
    python = "python"
    cpp = "cpp"
    java = "java"
    javascript = "javascript"


class TestCase(BaseModel):
    input: str
    output: str
    is_sample: bool = False


class SubmitRequest(BaseModel):
    problem_id: str
    code: str
    language: LanguageEnum
    test_cases: List[Any]
    time_limit: int = 2000   # ms
    memory_limit: int = 256  # MB


class TestResult(BaseModel):
    input: str
    expected: str
    output: str
    status: str  # pass | fail
    runtime: Optional[str] = None
    memory: Optional[str] = None
    error: Optional[str] = None


class SubmitResponse(BaseModel):
    status: str
    tests_passed: int
    total_tests: int
    results: List[TestResult]
    runtime: Optional[str] = None
    memory: Optional[str] = None
    error_output: Optional[str] = None


class QueueRequest(BaseModel):
    user_id: str
    rating: int


class QueueResponse(BaseModel):
    queue_id: Optional[str] = None
    duel_id: Optional[str] = None
    status: str  # queued | matched


class DuelSubmission(BaseModel):
    user_id: str
    code: str
    language: LanguageEnum
    problem_id: str
    duel_id: str


class AIHintRequest(BaseModel):
    user_id: str
    code: str
    error_output: Optional[str] = ""
    problem_description: str
    language: str
    conversation: List[Dict[str, str]] = []


class AIHintResponse(BaseModel):
    hint: str
