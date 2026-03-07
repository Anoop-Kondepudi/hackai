#!/usr/bin/env python3
"""Test with a realistic messy transcript — filler words, crosstalk, ambiguity, mishears."""

import os
import time
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
client = OpenAI()

SYSTEM_PROMPT = """You are a meeting task extractor. Only extract ACTIONABLE items. Ignore opinions, questions, status updates, deferred items.
If someone walks back a task, set status to cancelled. Never duplicate tasks.
Labels: bug = broken, feature = new, refactor = restructuring, improvement = enhancing.

Return ONLY the task tracker, no other text, no markdown fences:

## TASK-{n}: {short title} [DRAFT]
Issue: (pending)
Status: {draft | cancelled}
Label: {bug | feature | refactor | improvement}
Last-Updated: {HH:MM:SS}
Description: {1-2 sentences}
Source: "{quote}" ({speaker}, {timestamp})"""

# Realistic messy transcript — filler words, crosstalk, ambiguity, speech-to-text errors
MESSY_TRANSCRIPT = """## Current Task Tracker
(empty - first chunk)

## Full Meeting Transcript

[
  {"speaker": "Speaker 1", "text": "okay so um lets get started i guess, shiv you wanna go first?", "timestamp": "2026-03-07T14:00:00Z"},
  {"speaker": "Speaker 2", "text": "yeah so uh the the login page is like totally broken on mobile, like users are reporting they cant even see the login button its just like cut off or something", "timestamp": "2026-03-07T14:00:05Z"},
  {"speaker": "Speaker 1", "text": "wait really? since when", "timestamp": "2026-03-07T14:00:12Z"},
  {"speaker": "Speaker 2", "text": "i think since we pushed that last CSS update like two days ago, the responsive styles are messed up", "timestamp": "2026-03-07T14:00:16Z"},
  {"speaker": "Speaker 1", "text": "ok yeah thats bad we need to fix that asap, can you look into the mobile responsive issues on the login page", "timestamp": "2026-03-07T14:00:22Z"},
  {"speaker": "Speaker 2", "text": "yeah ill take it", "timestamp": "2026-03-07T14:00:26Z"},
  {"speaker": "Speaker 3", "text": "oh also speaking of that i noticed the um the authintication endpoint is returning like 500 errors sometimes, not always but like maybe 10 percent of requests", "timestamp": "2026-03-07T14:00:30Z"},
  {"speaker": "Speaker 1", "text": "thats a different issue right? not the CSS thing", "timestamp": "2026-03-07T14:00:38Z"},
  {"speaker": "Speaker 3", "text": "yeah totally different, the backend is throwing null pointer exceptions when the session token is expired i think", "timestamp": "2026-03-07T14:00:42Z"},
  {"speaker": "Speaker 1", "text": "ok nishil can you debug the auth end point 500 errors, check the session token handling", "timestamp": "2026-03-07T14:00:48Z"},
  {"speaker": "Speaker 3", "text": "on it", "timestamp": "2026-03-07T14:00:52Z"},
  {"speaker": "Speaker 2", "text": "hey so i was also thinking we should maybe like consider moving to tailwind from our custom css? its kind of a mess right now and", "timestamp": "2026-03-07T14:00:55Z"},
  {"speaker": "Speaker 1", "text": "yeah no thats a big project lets not go there right now, maybe next quarter", "timestamp": "2026-03-07T14:01:02Z"},
  {"speaker": "Speaker 2", "text": "fair enough", "timestamp": "2026-03-07T14:01:06Z"},
  {"speaker": "Speaker 3", "text": "um what about the the data export thing that enterprise customers have been asking about, like the ability to export there data as CSV", "timestamp": "2026-03-07T14:01:10Z"},
  {"speaker": "Speaker 1", "text": "oh yeah we definitely need to build that, its been requested like five times now. shiv can you add a CSV export endpoint for the user data api", "timestamp": "2026-03-07T14:01:18Z"},
  {"speaker": "Speaker 2", "text": "sure, should i also do like PDF or just CSV for now", "timestamp": "2026-03-07T14:01:25Z"},
  {"speaker": "Speaker 1", "text": "just CSV for now lets keep it simple", "timestamp": "2026-03-07T14:01:29Z"},
  {"speaker": "Speaker 3", "text": "oh and one more thing the the deploy pipeline has been super flaky lately, like every other deploy fails and we have to retry", "timestamp": "2026-03-07T14:01:33Z"},
  {"speaker": "Speaker 1", "text": "ugh yeah i noticed that too. nishil can you look into why the CI CD pipeline is failing intermittantly, might be a docker caching issue or something", "timestamp": "2026-03-07T14:01:42Z"},
  {"speaker": "Speaker 3", "text": "will do, i think its actually the node modules cache thats stale", "timestamp": "2026-03-07T14:01:48Z"},
  {"speaker": "Speaker 2", "text": "oh wait actually about the CSV thing, do we need to handle like GDPR stuff? like should we redact certain fields", "timestamp": "2026-03-07T14:01:53Z"},
  {"speaker": "Speaker 1", "text": "good point yeah make sure the CSV export excludes sensitive PII fields, like social security numbers and bank details if we have any of that", "timestamp": "2026-03-07T14:02:00Z"},
  {"speaker": "Speaker 1", "text": "alright i think thats it, oh wait actually nishil that thing you mentioned last week about the memory leak in the worker process, did that get fixed", "timestamp": "2026-03-07T14:02:08Z"},
  {"speaker": "Speaker 3", "text": "no not yet, i havent had time", "timestamp": "2026-03-07T14:02:14Z"},
  {"speaker": "Speaker 1", "text": "ok lets make sure to fix the memory leak in the background worker, its probably why our server costs went up", "timestamp": "2026-03-07T14:02:19Z"},
  {"speaker": "Speaker 3", "text": "yeah ill prioritize that", "timestamp": "2026-03-07T14:02:23Z"},
  {"speaker": "Speaker 1", "text": "cool, anything else? no? ok lets wrap up", "timestamp": "2026-03-07T14:02:27Z"}
]"""

# Expected tasks from this messy transcript:
# 1. Fix mobile responsive login page (bug)
# 2. Debug auth endpoint 500 errors / session token handling (bug)
# 3. Build CSV export endpoint for user data (feature) — should include PII exclusion
# 4. Fix flaky CI/CD pipeline (bug)
# 5. Fix memory leak in background worker (bug)
# NOT a task: Tailwind migration (explicitly deferred to next quarter)
# NOT a task: PDF export (explicitly scoped out — "just CSV for now")

EXPECTED = 5


def run_test(model):
    start = time.time()
    response = client.chat.completions.create(
        model=model,
        temperature=0,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": MESSY_TRANSCRIPT},
        ],
    )
    elapsed = time.time() - start
    output = response.choices[0].message.content
    task_count = output.count("## TASK-")
    return {
        "model": model,
        "time": round(elapsed, 2),
        "tasks": task_count,
        "output": output,
    }


MODELS = ["gpt-4.1-nano", "gpt-4o", "gpt-4.1-mini"]

print("=== Messy Transcript Benchmark ===")
print(f"Expected tasks: {EXPECTED}")
print(f"Expected NOT tasks: Tailwind migration, PDF export\n")

for model in MODELS:
    try:
        print(f"--- {model} ---")
        r = run_test(model)
        print(f"Time: {r['time']}s | Tasks: {r['tasks']}/{EXPECTED}")
        print(r["output"])
        print()
    except Exception as e:
        print(f"FAILED: {e}\n")
