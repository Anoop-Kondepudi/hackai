#!/bin/bash
# Test the task extractor prompt with different models and effort levels
# Usage: ./backend/test_extractor.sh [model] [effort]
set -euo pipefail

MODEL="${1:-haiku}"
EFFORT="${2:-low}"
RUN_ID="${MODEL}_${EFFORT}"
OUT_FILE="/tmp/extractor_${RUN_ID}_output.md"
ERR_FILE="/tmp/extractor_${RUN_ID}_stderr.log"

CLAUDE_CMD="env -u CLAUDECODE -u CLAUDE_CODE_SSE_PORT -u CLAUDE_CODE_ENTRYPOINT -u CLAUDE_CODE_SUBAGENT_MODEL -u CLAUDE_CODE_EFFORT_LEVEL -u CLAUDE_CODE_MAX_OUTPUT_TOKENS -u CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS claude"

PROMPT=$(cat <<'EOF'
You are a meeting task extractor. Read the instructions below, then process the transcript and return the updated task tracker.

## Instructions

Only extract ACTIONABLE items. Ignore opinions, questions, status updates, general discussion.
A task must have a clear action. "We should think about X" is NOT a task. "Add rate limiting to the API" IS a task.
If someone walks back or cancels a task, set status to cancelled.
Before creating a new task, check if an existing task covers the same work. Never duplicate.
What is NOT a task: opinions, questions without action, status updates, vague ideas, deferred items ("let's revisit later", "not now", "backlog", "nice to have").
Labels: bug = something broken, feature = new functionality, refactor = restructuring, improvement = enhancing existing.

Return ONLY the updated task tracker in this exact format. No other text, no explanation, no markdown fences:

## TASK-{n}: {short title} [DRAFT]
Issue: (pending)
Status: {draft | cancelled}
Label: {bug | feature | refactor | improvement}
Last-Updated: {HH:MM:SS}
Description: {1-2 sentences}
Source: "{relevant quote}" ({speaker}, {timestamp})

---

## Current Task Tracker
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
]
EOF
)

echo "=== Task Extractor Test ==="
echo "Model: $MODEL | Effort: $EFFORT"
echo "==========================="

START_SEC=$(python3 -c "import time; print(time.time())")

$CLAUDE_CMD -p \
  --model "$MODEL" \
  --effort "$EFFORT" \
  --tools "" \
  --no-chrome \
  --dangerously-skip-permissions \
  "$PROMPT" > "$OUT_FILE" 2>"$ERR_FILE"

END_SEC=$(python3 -c "import time; print(time.time())")
ELAPSED=$(python3 -c "print(f'{$END_SEC - $START_SEC:.2f}')")

TASK_COUNT=$(grep -c "^## TASK-" "$OUT_FILE" || echo 0)
echo "Time: ${ELAPSED}s | Tasks: $TASK_COUNT"
echo ""
echo "=== Output ==="
cat "$OUT_FILE"
