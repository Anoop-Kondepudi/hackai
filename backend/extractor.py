"""OpenAI API wrapper for task extraction."""

import os
import logging
from openai import OpenAI, APIError, AuthenticationError
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

log = logging.getLogger(__name__)

client = OpenAI()

SYSTEM_PROMPT = """You are a meeting task extractor. Only extract ACTIONABLE items. Ignore opinions, questions, status updates, general discussion.

Rules:
- A task must have a clear action someone commits to doing. "We should think about X" is NOT a task. "We need to fix X" or "Let's add X" IS a task.
- NEVER invent or assume tasks. Only extract tasks that are EXPLICITLY stated in the transcript. If no one said it, it is not a task.
- If someone walks back or cancels a task ("actually let's not do that", "skip that"), set status to cancelled.
- Before creating a new task, check if an existing task covers the same work. Never duplicate.
- Two tasks are duplicates if they would result in the same code change, even if described differently.
- If new information comes up about an existing task, UPDATE it — do not create a new one.
- What is NOT a task: opinions, questions without action, status updates, vague ideas, deferred items ("let's revisit later", "not now", "backlog", "nice to have").

Labels: bug = something broken, feature = new functionality, refactor = restructuring existing code, improvement = enhancing existing functionality.

IMPORTANT: You MUST include ALL existing tasks from the current tracker in your output, even if they were not mentioned in the latest transcript. Never drop tasks. Only add, update, or cancel.

Return ONLY the updated task tracker in the exact format below. No other text, no explanation, no markdown fences.

## TASK-{n}: {short title} [DRAFT]
Issue: (pending)
Status: draft (ALWAYS "draft" for new tasks. For existing tasks, copy their status EXACTLY from the tracker — do NOT change it.)
Label: {bug | feature | refactor | improvement}
Last-Updated: {HH:MM:SS}
Description: {1-2 sentences of what needs to be done}
Source: "{relevant quote}" ({speaker}, {timestamp})

CRITICAL FORMAT RULES:
- The Issue field MUST be exactly "(pending)" for all tasks. Do NOT write descriptions or context in the Issue field.
- Include ALL tasks from the current tracker, not just new ones.
- If nothing actionable was said and there are existing tasks, return them unchanged.
- If nothing actionable was said and there are NO existing tasks, return EXACTLY the text: (no tasks)
- NEVER create tasks about the meeting itself, the task tracker, or the pipeline. Only real engineering work."""

MODEL = os.getenv("EXTRACTOR_MODEL", "gpt-4.1-nano")


def extract_tasks(transcript_text: str, current_tasks_md: str) -> str | None:
    """Send transcript + current tasks to the model, return updated tasks.md content.

    Returns None on failure (caller should preserve existing tasks).
    """
    user_message = f"""## Current Task Tracker
{current_tasks_md if current_tasks_md.strip() else "(empty - no tasks yet)"}

## Full Meeting Transcript
{transcript_text}"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            temperature=0,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
        )
        content = response.choices[0].message.content
        return content if content else None
    except AuthenticationError:
        log.error("OpenAI API authentication failed — check OPENAI_API_KEY")
        return None
    except APIError as e:
        log.error(f"OpenAI API error: {e}")
        return None
    except Exception as e:
        log.error(f"Unexpected error calling OpenAI: {e}")
        return None
