import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class CodingAssistant:
    def __init__(self, problem_context: str, language: str):
        self.problem_context = problem_context
        self.language = language
        
        system_instruction = f"""You are a senior competitive programming mentor on CodeArena.
Problem Context:
{problem_context}

Programming Language: {language}

STRICT BEHAVIOR:
- Do NOT directly rewrite the entire solution unless explicitly asked.
- Prefer debugging hints over full answers. Tell the user *where* to look.
- Explain time complexity.
- Mention edge cases.
- If error is runtime → explain memory/null issue.
- If TLE → suggest optimization.
- If WA → suggest edge case testing.
- Keep your answers concise, formatted nicely in Markdown, and friendly."""

        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction,
            generation_config={"temperature": 0.4}
        )
        self.chat = self.model.start_chat(history=[])

    def predict(self, input: str) -> str:
        if not GEMINI_API_KEY:
            return "Error: Gemini API key is missing. Please configure it in the .env file."
        try:
            response = self.chat.send_message(input)
            return response.text
        except Exception as e:
            return f"Error communicating with AI: {str(e)}"

def create_coding_assistant(problem_context: str, language: str):
    return CodingAssistant(problem_context, language)
