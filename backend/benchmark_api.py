#!/usr/bin/env python3
"""Benchmark task extraction via OpenAI API directly — no CLI overhead."""

import os
import time
import json
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


def run_test(model, temperature=0):
    start = time.time()
    response = client.chat.completions.create(
        model=model,
        temperature=temperature,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": TRANSCRIPT},
        ],
    )
    elapsed = time.time() - start
    output = response.choices[0].message.content
    task_count = output.count("## TASK-")
    tokens_in = response.usage.prompt_tokens
    tokens_out = response.usage.completion_tokens
    return {
        "model": model,
        "time": round(elapsed, 2),
        "tasks": task_count,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "output": output,
    }


MODELS = [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
]

print("=== OpenAI API Benchmark ===\n")
results = []
for model in MODELS:
    try:
        print(f"Testing {model}...", end=" ", flush=True)
        r = run_test(model)
        results.append(r)
        print(f"{r['time']}s | {r['tasks']} tasks | {r['tokens_in']}+{r['tokens_out']} tokens")
    except Exception as e:
        print(f"FAILED: {e}")

print("\n=== Summary ===\n")
print(f"{'Model':<20} {'Time':>6} {'Tasks':>6} {'In':>6} {'Out':>6}")
print("-" * 50)
for r in results:
    print(f"{r['model']:<20} {r['time']:>5}s {r['tasks']:>5} {r['tokens_in']:>6} {r['tokens_out']:>6}")

# Save best output for review
if results:
    fastest = min(results, key=lambda x: x["time"])
    print(f"\n=== Fastest: {fastest['model']} ({fastest['time']}s) ===\n")
    print(fastest["output"])
