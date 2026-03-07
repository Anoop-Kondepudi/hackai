#!/bin/bash
# Benchmark task extraction across models/effort levels
# Writes results to /tmp/benchmark_results.txt
set -euo pipefail

CLAUDE_CMD="env -u CLAUDECODE -u CLAUDE_CODE_SSE_PORT -u CLAUDE_CODE_ENTRYPOINT -u CLAUDE_CODE_SUBAGENT_MODEL -u CLAUDE_CODE_EFFORT_LEVEL -u CLAUDE_CODE_MAX_OUTPUT_TOKENS -u CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS claude"

PROMPT=$(cat <<'EOF'
You are a meeting task extractor. Only extract ACTIONABLE items. Ignore opinions, questions, status updates, deferred items.
If someone walks back a task, set status to cancelled. Never duplicate tasks.
Labels: bug = broken, feature = new, refactor = restructuring, improvement = enhancing.

Return ONLY the task tracker, no other text:

## TASK-{n}: {short title} [DRAFT]
Issue: (pending)
Status: {draft | cancelled}
Label: {bug | feature | refactor | improvement}
Last-Updated: {HH:MM:SS}
Description: {1-2 sentences}
Source: "{quote}" ({speaker}, {timestamp})

## Current Task Tracker
(empty)

## Transcript
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

RESULTS="/tmp/benchmark_results.txt"
echo "=== Benchmark Results ===" > "$RESULTS"
echo "" >> "$RESULTS"

run_test() {
  local model="$1"
  local effort="$2"
  local out="/tmp/bench_${model}_${effort}.md"

  local start=$(python3 -c "import time; print(time.time())")

  $CLAUDE_CMD -p \
    --model "$model" \
    --effort "$effort" \
    --tools "" \
    --no-chrome \
    --dangerously-skip-permissions \
    "$PROMPT" > "$out" 2>/dev/null

  local end=$(python3 -c "import time; print(time.time())")
  local elapsed=$(python3 -c "print(f'{$end - $start:.2f}')")
  local tasks=$(grep -c "^## TASK-" "$out" 2>/dev/null || echo 0)

  echo "$model ($effort): ${elapsed}s | ${tasks} tasks" >> "$RESULTS"
  echo "$model ($effort): ${elapsed}s | ${tasks} tasks"
}

echo "Running haiku low..."
run_test haiku low
echo "Running haiku medium..."
run_test haiku medium
echo "Running haiku high..."
run_test haiku high
echo "Running sonnet low..."
run_test sonnet low

echo ""
echo "=== Final Results ==="
cat "$RESULTS"
