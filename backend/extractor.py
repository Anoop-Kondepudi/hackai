"""OpenAI API wrapper for task extraction."""

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

client = OpenAI()

SYSTEM_PROMPT = """You are a meeting task extractor. Only extract ACTIONABLE items. Ignore opinions, questions, status updates, general discussion.

Rules:
- A task must have a clear action. "We should think about X" is NOT a task.
- If someone walks back or cancels a task ("actually let's not do that", "skip that"), set status to cancelled.
- Before creating a new task, check if an existing task covers the same work. Never duplicate.
- If new information comes up about an existing task, UPDATE it — do not create a new one.
- What is NOT a task: opinions, questions without action, status updates, vague ideas, deferred items ("let's revisit later", "not now", "backlog", "nice to have").

Labels: bug = something broken, feature = new functionality, refactor = restructuring existing code, improvement = enhancing existing functionality.

Return ONLY the updated task tracker in the exact format below. No other text, no explanation, no markdown fences. Include ALL tasks (existing + new), not just changes.

## TASK-{n}: {short title} [DRAFT]
Issue: (pending)
Status: {draft | cancelled}
Label: {bug | feature | refactor | improvement}
Last-Updated: {HH:MM:SS}
Description: {1-2 sentences of what needs to be done}
Source: "{relevant quote}" ({speaker}, {timestamp})

If nothing actionable was said, return the task tracker unchanged."""

MODEL = os.getenv("EXTRACTOR_MODEL", "gpt-4.1-nano")


def extract_tasks(transcript_text: str, current_tasks_md: str) -> str:
    """Send transcript + current tasks to the model, return updated tasks.md content."""
    user_message = f"""## Current Task Tracker
{current_tasks_md if current_tasks_md.strip() else "(empty - no tasks yet)"}

## Full Meeting Transcript
{transcript_text}"""

    response = client.chat.completions.create(
        model=MODEL,
        temperature=0,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
    )
    return response.choices[0].message.content
