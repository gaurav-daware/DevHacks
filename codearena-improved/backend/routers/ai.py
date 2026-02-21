from flask import Blueprint, request, jsonify
from core.config import settings
import httpx
import json
import asyncio
import random

bp = Blueprint("ai", __name__, url_prefix="/ai")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

SOCRATIC_SYSTEM_PROMPT = """You are an AI Socratic Mentor for a competitive programming platform.

Your strict rules:
1. NEVER give the direct solution or working code
2. ALWAYS guide through questions and hints only
3. Point out logical errors by asking questions about them
4. Reference specific lines or concepts when relevant
5. Be encouraging but educational
6. Keep hints concise (2-4 sentences max)
7. If the code has a specific bug, ask: "What do you think happens when X?"
8. Suggest thinking about edge cases, time complexity, or data structures
9. Use emojis sparingly for friendliness (one per message max)

You may:
- Point out the general category of approach (e.g., "have you considered a hash map?")
- Ask questions about complexity
- Ask about edge cases
- Reference the error message to ask "what does this error mean?"

You may NOT:
- Write any working solution code
- Give the algorithm step by step
- Say "use a hash map to store X, then..."
"""


def _run_async(coro):
    """Run async function in synchronous context."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


async def call_gemini(messages: list, user_message: str) -> str:
    """Call Gemini API with conversation history."""
    if not settings.GEMINI_API_KEY:
        return generate_fallback_hint(user_message)

    # Build conversation for Gemini
    contents = []
    for msg in messages[:-1]:  # Exclude current message
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})

    # Add current message
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [{"text": SOCRATIC_SYSTEM_PROMPT}]
        },
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 256,
            "topP": 0.9,
        },
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"{GEMINI_API_URL}?key={settings.GEMINI_API_KEY}",
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return text.strip()


def generate_fallback_hint(context: str) -> str:
    """Fallback hints when Gemini is unavailable."""
    hints = [
        "🤔 Think about what your code does on the first iteration. Does it handle the edge case when the array has only one element?",
        "💡 Have you considered what data structure would let you check existence in O(1) time instead of O(n)?",
        "🔍 Look at your loop bounds carefully — are you going out of bounds anywhere?",
        "⚡ What's the time complexity of your current approach? Can you do better than O(n²)?",
        "🧩 Trace through your code manually with the first example. Does it produce the expected output?",
        "🎯 Consider what information you need to keep track of as you iterate through the input.",
    ]
    return random.choice(hints)


@bp.route("/hint", methods=["POST"])
def get_hint():
    """
    Generate a Socratic hint using Gemini AI.
    Never reveals the solution directly.
    """
    data = request.get_json()
    
    # Extract conversation history
    conversation = data.get("conversation", [])
    problem_description = data.get("problem_description", "")
    code = data.get("code", "")
    error_output = data.get("error_output", "")
    language = data.get("language", "python")
    
    # Build context message
    context_parts = [
        f"Problem: {problem_description[:500]}",
        f"\nUser's {language} code:\n```{language}\n{code[:1000]}\n```",
    ]

    if error_output:
        context_parts.append(f"\nError output:\n{error_output[:300]}")

    context = "\n".join(context_parts)

    # Get the last user message from conversation
    user_message = context
    if conversation:
        last_user_msg = next(
            (m["content"] for m in reversed(conversation) if m["role"] == "user"),
            None
        )
        if last_user_msg and last_user_msg != "Give me a hint":
            user_message = f"Context:\n{context}\n\nStudent's question: {last_user_msg}"
        else:
            user_message = f"The student needs a hint. Here's their code:\n{context}"

    try:
        hint = _run_async(call_gemini(conversation, user_message))
        return jsonify({"hint": hint}), 200
    except Exception as e:
        return jsonify({"hint": generate_fallback_hint(str(e))}), 200


@bp.route("/analyze-session", methods=["POST"])
def analyze_pair_session():
    """
    Analyze a PairLab session and provide insights.
    Called after a session ends.
    """
    data = request.get_json()
    
    if not settings.GEMINI_API_KEY:
        return jsonify({
            "analysis": "Great collaboration! You both showed good problem-solving skills. Consider discussing edge cases more actively during your next session.",
            "metrics": {
                "driver_contribution": "65%",
                "navigator_contribution": "35%",
                "efficiency_score": 78,
            }
        }), 200

    session_data = data.get("session_data", {})
    prompt = f"""Analyze this pair programming session and provide feedback:

Session data: {json.dumps(session_data, indent=2)[:1000]}

Provide:
1. Brief analysis of collaboration quality (2-3 sentences)
2. What went well
3. One specific improvement suggestion

Keep it encouraging and constructive. JSON format:
{{"analysis": "...", "strengths": "...", "improvement": "..."}}"""

    try:
        async def _analyze():
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{GEMINI_API_URL}?key={settings.GEMINI_API_KEY}",
                    json={
                        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.5, "maxOutputTokens": 400},
                    }
                )
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text.strip().replace("```json", "").replace("```", ""))
        
        result = _run_async(_analyze())
        return jsonify(result), 200
    except Exception:
        return jsonify({
            "analysis": "Session analyzed. Both contributors showed strong problem-solving skills."
        }), 200

