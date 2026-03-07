#!/usr/bin/env python3
"""
Simulate a real meeting flow with incremental transcript chunks.

Tests: extraction, relevance checking, and stabilization.

Usage:
    python tests/simulate_meeting.py
"""

import json
import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from orchestrator import run_cycle

# Simulated transcript — each entry is one ~5-second chunk
# Designed to test: no hallucination, task creation, relevance keeping tasks active,
# and stabilization once a topic is truly done.
MEETING_CHUNKS = [
    # No tasks yet
    ("Shiv", "Hey everyone, let's get started. How's everything going?"),
    ("Anoop", "Good, good. So I looked at the login page this morning."),

    # OAuth topic starts — task should be created around here
    ("Anoop", "The login is broken. Google OAuth redirect URI is wrong in production."),
    ("Shiv", "Got it, we need to fix the redirect URI in the prod config."),

    # Rate limiting topic starts — second task
    ("Shiv", "Also, the API has been getting hammered lately."),
    ("Anoop", "We should add rate limiting to the endpoints."),

    # Still talking about OAuth — relevance check should keep TASK-1 active
    ("Anoop", "Going back to the OAuth thing — the callback URL points to localhost."),
    ("Shiv", "Yeah that's definitely the issue with the OAuth redirect."),

    # Casual chat — no tasks, both topics should start stabilizing
    ("Shiv", "By the way, did you see the new dashboard mockups?"),
    ("Anoop", "Yeah they look great. Nice work from the design team."),

    # More silence on tasks — should continue stabilizing
    ("Shiv", "Alright, I think that covers everything for today."),
    ("Anoop", "Sounds good. Let's sync up again tomorrow."),
]


def main():
    sim_dir = PROJECT_ROOT / "data" / "sim_transcripts"
    tasks_file = PROJECT_ROOT / "data" / "tasks" / "tasks.md"

    # Start clean
    if sim_dir.exists():
        shutil.rmtree(sim_dir)
    sim_dir.mkdir(parents=True, exist_ok=True)
    if tasks_file.exists():
        tasks_file.unlink()

    base_time = datetime(2026, 3, 7, 14, 0, 0)
    all_chunks = []
    prev_chunk_count = 0

    print("=" * 60)
    print("  MEETING SIMULATION (DRY RUN + RELEVANCE CHECK)")
    print("=" * 60)
    print()

    for i, (speaker, text) in enumerate(MEETING_CHUNKS):
        chunk_time = base_time + timedelta(seconds=i * 5)
        timestamp = chunk_time.strftime("%Y-%m-%dT%H:%M:%S")

        chunk = {"speaker": speaker, "text": text, "timestamp": timestamp}
        all_chunks.append(chunk)

        # Write accumulated chunks
        (sim_dir / "transcript.json").write_text(json.dumps(all_chunks, indent=2))

        print(f"--- Chunk {i + 1}/{len(MEETING_CHUNKS)} [{timestamp}] ---")
        print(f"  {speaker}: \"{text}\"")
        print()

        _, prev_chunk_count = run_cycle(sim_dir, dry_run=True, prev_chunk_count=prev_chunk_count)

        # Show task state
        if tasks_file.exists():
            content = tasks_file.read_text().strip()
            task_count = content.count("## TASK-")
            if task_count > 0:
                print(f"\n  [state] {task_count} task(s):")
                for line in content.split("\n"):
                    if line.startswith("## TASK-"):
                        print(f"    {line}")
                    elif line.startswith("Unchanged-Cycles:") or line.startswith("Status:"):
                        print(f"      {line}")
        print()
        print()

    # Stabilization cycles
    print("=" * 60)
    print("  MEETING ENDED — stabilization cycles")
    print("=" * 60)
    print()

    for cycle in range(1, 5):
        print(f"--- Stabilization cycle {cycle}/4 ---")
        _, prev_chunk_count = run_cycle(sim_dir, dry_run=True, prev_chunk_count=prev_chunk_count)

        if tasks_file.exists():
            content = tasks_file.read_text().strip()
            for line in content.split("\n"):
                if line.startswith("## TASK-"):
                    print(f"  {line}")
                elif line.startswith("Status:") or line.startswith("Unchanged-Cycles:"):
                    print(f"    {line}")
        print()

    # Final
    print("=" * 60)
    print("  FINAL tasks.md")
    print("=" * 60)
    if tasks_file.exists():
        print(tasks_file.read_text())

    shutil.rmtree(sim_dir)


if __name__ == "__main__":
    main()
