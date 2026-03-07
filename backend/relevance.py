"""Check which tasks are actively being discussed in recent transcript chunks."""

import os
import logging
from openai import OpenAI, APIError, AuthenticationError
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

log = logging.getLogger(__name__)

client = OpenAI()

RELEVANCE_PROMPT = """You are given a snippet of meeting transcript and a list of task titles.
Determine which tasks (if any) are being actively discussed in this snippet.

A task is "actively discussed" if the snippet contains conversation directly about that task's topic — not just vaguely related words.

Return ONLY a comma-separated list of task IDs that are being discussed, or "none" if no tasks are mentioned.
Example: 1,3
Example: none"""

MODEL = os.getenv("EXTRACTOR_MODEL", "gpt-4.1-nano")


def check_relevance(new_chunks: list[dict], tasks: list) -> set[int]:
    """Check which tasks are being discussed in the new chunks.

    Returns a set of task IDs that are actively being discussed.
    """
    if not new_chunks or not tasks:
        return set()

    # Format the new chunks
    snippet = "\n".join(
        f"[{c.get('timestamp', '')}] {c.get('speaker', 'Unknown')}: {c.get('text', '')}"
        for c in new_chunks
    )

    # Format task list
    task_list = "\n".join(f"- ID {t.id}: {t.title}" for t in tasks)

    user_message = f"""## Recent Transcript
{snippet}

## Current Tasks
{task_list}"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            temperature=0,
            messages=[
                {"role": "system", "content": RELEVANCE_PROMPT},
                {"role": "user", "content": user_message},
            ],
        )
        content = response.choices[0].message.content
        if not content or content.strip().lower() == "none":
            return set()

        # Parse comma-separated IDs
        ids = set()
        for part in content.strip().split(","):
            part = part.strip()
            if part.isdigit():
                ids.add(int(part))
        return ids
    except (AuthenticationError, APIError) as e:
        log.error(f"Relevance check failed: {e}")
        return set()
    except Exception as e:
        log.error(f"Unexpected error in relevance check: {e}")
        return set()
