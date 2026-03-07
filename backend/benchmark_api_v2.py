#!/usr/bin/env python3
"""Round 2: Run top candidates 3 times each for consistency."""

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

TRANSCRIPT = """## Current Task Tracker
(empty - first chunk)

## Full Meeting Transcript

[
  {"speaker": "Anoop", "text": "Alright let's go over what we need to get done this week.", "timestamp": "2026-03-07T14:00:00Z"},
  {"speaker": "Shiv", "text": "So the auth system is completely broken right now. Users can't log in with Google OAuth, it's been down since yesterday.", "timestamp": "2026-03-07T14:00:05Z"},
  {"speaker": "Anoop", "text": "Okay that's critical, we need to fix the Google OAuth login ASAP. Shiv can you take that?", "timestamp": "2026-03-07T14:00:12Z"},
  {"speaker": "Shiv", "text": "Yeah I'll handle it. I think the redirect URI is wrong in production.", "timestamp": "2026-03-07T14:00:18Z"},
  {"speaker": "Nishil", "text": "Also we need to add rate limiting to the API. We got hit with a ton of requests last night and it took everything down.", "timestamp": "2026-03-07T14:00:25Z"},
  {"speaker": "Anoop", "text": "Good call. Nishil can you add rate limiting to the API endpoints? Maybe start with 100 requests per minute per user.", "timestamp": "2026-03-07T14:00:33Z"},
  {"speaker": "Nishil", "text": "On it. I'll use a token bucket approach.", "timestamp": "2026-03-07T14:00:40Z"},
  {"speaker": "Anoop", "text": "Cool. I also want to refactor the dashboard to use WebSockets instead of polling. The current polling is every 5 seconds and it's wasteful.", "timestamp": "2026-03-07T14:00:48Z"},
  {"speaker": "Shiv", "text": "Makes sense. Oh and we should probably write tests for the payment flow. There's zero test coverage there and it's our most critical path.", "timestamp": "2026-03-07T14:00:57Z"},
  {"speaker": "Anoop", "text": "Agreed, let's add unit tests for the payment processing module. I'll take that one.", "timestamp": "2026-03-07T14:01:05Z"},
  {"speaker": "Nishil", "text": "One more thing, the error messages are super vague. When something fails the user just sees 'Something went wrong'. We should add proper error messages throughout the app.", "timestamp": "2026-03-07T14:01:14Z"},
  {"speaker": "Anoop", "text": "That's a bigger task but yeah it's important. Let's track it but it's lower priority than the OAuth and rate limiting stuff.", "timestamp": "2026-03-07T14:01:23Z"},
  {"speaker": "Shiv", "text": "Sounds good. Anything else?", "timestamp": "2026-03-07T14:01:30Z"},
  {"speaker": "Anoop", "text": "I think that's it for now. Let's sync again tomorrow.", "timestamp": "2026-03-07T14:01:35Z"}
]"""


def run_test(model):
    start = time.time()
    response = client.chat.completions.create(
        model=model,
        temperature=0,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": TRANSCRIPT},
        ],
    )
    elapsed = time.time() - start
    output = response.choices[0].message.content
    task_count = output.count("## TASK-")
    has_error_msg_task = "error message" in output.lower()
    return {
        "time": round(elapsed, 2),
        "tasks": task_count,
        "has_task5": has_error_msg_task,
        "cost_in": response.usage.prompt_tokens,
        "cost_out": response.usage.completion_tokens,
        "output": output,
    }


MODELS = ["gpt-4.1-nano", "gpt-4o", "gpt-4.1-mini"]
RUNS = 3

print("=== Consistency Benchmark (3 runs each) ===\n")

for model in MODELS:
    print(f"--- {model} ---")
    times = []
    task_counts = []
    task5_hits = []
    for i in range(RUNS):
        try:
            r = run_test(model)
            times.append(r["time"])
            task_counts.append(r["tasks"])
            task5_hits.append(r["has_task5"])
            print(f"  Run {i+1}: {r['time']}s | {r['tasks']} tasks | task5={r['has_task5']}")
        except Exception as e:
            print(f"  Run {i+1}: FAILED — {e}")

    if times:
        avg = sum(times) / len(times)
        print(f"  AVG: {avg:.2f}s | tasks: {task_counts} | task5: {task5_hits}\n")

print("=== Best output (gpt-4.1-nano last run) ===\n")
# Run one final nano test and print full output
r = run_test("gpt-4.1-nano")
print(r["output"])
