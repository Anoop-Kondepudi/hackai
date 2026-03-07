#!/usr/bin/env python3
"""
Simulate a real meeting flow with incremental transcript chunks.

Tests: extraction, relevance checking, stabilization, and MEETING_ENDED signal.

Usage:
    python tests/simulate_meeting.py              # dry run
    python tests/simulate_meeting.py --live        # real GitHub issues
"""

import argparse
import json
import shutil
import sys
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from orchestrator import run_cycle

MEETING_CHUNKS = [
    # No tasks
    ("Shiv", "Hey everyone, let's get started. How's everything going?"),
    ("Anoop", "Good, good. So let's talk about what needs to get done."),

    # OAuth task emerges
    ("Anoop", "The login is broken. Google OAuth redirect URI is wrong in production."),
    ("Shiv", "Got it, we need to fix that redirect URI in the prod config."),

    # Rate limiting task
    ("Shiv", "Also, the API has been getting hammered lately."),
    ("Anoop", "We should add rate limiting to the endpoints. Maybe 100 per minute."),

    # Still discussing OAuth — should keep it active
    ("Anoop", "Going back to the OAuth thing — the callback URL points to localhost."),

    # Casual chat — tasks should start stabilizing
    ("Shiv", "By the way, did you see the new dashboard mockups?"),
    ("Anoop", "Yeah they look great."),

    # Meeting ends
    ("Shiv", "Alright, that's everything. Talk tomorrow."),
    ("SYSTEM", "MEETING_ENDED"),
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--live", action="store_true", help="Create real GitHub issues")
    args = parser.parse_args()

    sim_dir = PROJECT_ROOT / "data" / "sim_transcripts"
    tasks_file = PROJECT_ROOT / "data" / "tasks" / "tasks.md"
    dry_run = not args.live

    # Start clean
    if sim_dir.exists():
        shutil.rmtree(sim_dir)
    sim_dir.mkdir(parents=True, exist_ok=True)
    if tasks_file.exists():
        tasks_file.unlink()

    base_time = datetime(2026, 3, 7, 14, 0, 0)
    all_chunks = []
    prev_chunk_count = 0

    mode = "LIVE — real GitHub issues" if args.live else "DRY RUN"
    print("=" * 60)
    print(f"  MEETING SIMULATION ({mode})")
    print("=" * 60)
    print()

    for i, (speaker, text) in enumerate(MEETING_CHUNKS):
        chunk_time = base_time + timedelta(seconds=i * 5)
        timestamp = chunk_time.strftime("%Y-%m-%dT%H:%M:%S")

        chunk = {"speaker": speaker, "text": text, "timestamp": timestamp}
        all_chunks.append(chunk)

        (sim_dir / "transcript.json").write_text(json.dumps(all_chunks, indent=2))

        print(f"--- Chunk {i + 1}/{len(MEETING_CHUNKS)} [{timestamp}] ---")
        print(f"  {speaker}: \"{text}\"")
        print()

        _, prev_chunk_count = run_cycle(sim_dir, dry_run=dry_run, prev_chunk_count=prev_chunk_count)

        # Show task state
        if tasks_file.exists():
            content = tasks_file.read_text().strip()
            task_count = content.count("## TASK-")
            if task_count > 0:
                print(f"\n  [state] {task_count} task(s):")
                for line in content.split("\n"):
                    if line.startswith("## TASK-"):
                        print(f"    {line}")
                    elif line.startswith("Status:") or line.startswith("Unchanged-Cycles:"):
                        print(f"      {line}")
        print()
        print()

    # Final state
    print("=" * 60)
    print("  FINAL tasks.md")
    print("=" * 60)
    if tasks_file.exists():
        print(tasks_file.read_text())

    shutil.rmtree(sim_dir)


if __name__ == "__main__":
    main()
