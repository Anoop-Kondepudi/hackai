#!/usr/bin/env python3
"""
Main orchestrator loop for the meeting-to-PR pipeline.

Watches for transcript chunks, extracts tasks via AI, manages GitHub issues.

Usage:
    python backend/orchestrator.py                    # default 5s interval
    python backend/orchestrator.py --interval 10      # custom interval
    python backend/orchestrator.py --dry-run           # no GitHub ops
    python backend/orchestrator.py --once              # single run, no loop
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

from extractor import extract_tasks
from task_parser import parse_tasks, diff_tasks, tasks_to_md, Task
from github_ops import create_issue, edit_issue, close_issue, remove_label

logging.basicConfig(level=logging.WARNING, format="%(levelname)s: %(message)s")

# Paths
TRANSCRIPTS_DIR = PROJECT_ROOT / "data" / "transcripts"
TASKS_FILE = PROJECT_ROOT / "data" / "tasks" / "tasks.md"
FAKE_DATA_DIR = PROJECT_ROOT / "data" / "fake"

# Token safety (rough estimate: 1 token ≈ 4 chars)
MAX_CHARS = 80_000 * 4  # ~80k tokens

# Auto-stabilization threshold
STABILIZE_AFTER_CYCLES = 3


def read_transcripts(source_dir: Path) -> str:
    """Read all transcript JSON files and return as a formatted string."""
    all_chunks = []

    for f in sorted(source_dir.glob("*.json")):
        try:
            with open(f) as fh:
                data = json.load(fh)
                if isinstance(data, list):
                    all_chunks.extend(data)
                elif isinstance(data, dict):
                    all_chunks.append(data)
        except (json.JSONDecodeError, UnicodeDecodeError, PermissionError) as e:
            print(f"  [warn] Skipping {f.name}: {e}")
            continue

    # Sort by timestamp
    all_chunks.sort(key=lambda c: c.get("timestamp", ""))

    if not all_chunks:
        return ""

    return json.dumps(all_chunks, indent=2)


def read_tasks_md() -> str:
    """Read current tasks.md or return empty string."""
    if TASKS_FILE.exists():
        return TASKS_FILE.read_text().strip()
    return ""


def write_tasks_md(content: str):
    """Write updated tasks.md."""
    TASKS_FILE.parent.mkdir(parents=True, exist_ok=True)
    TASKS_FILE.write_text(content + "\n")


def format_issue_body(task: Task) -> str:
    """Format a task into a GitHub issue body."""
    return f"""**Label:** {task.label}
**Source:** {task.source}

## Description
{task.description}

---
*Auto-generated from meeting transcript by HackAI pipeline.*"""


def handle_github_ops(changes: dict, dry_run: bool = False):
    """Create/edit/close GitHub issues based on task changes."""

    for task in changes["added"]:
        if dry_run:
            print(f"  [dry-run] Would create issue: {task.title}")
            continue

        print(f"  [github] Creating issue: {task.title}")
        issue_num = create_issue(
            title=task.title,
            body=format_issue_body(task),
            label=task.label,
        )
        if issue_num:
            task.issue_number = f"#{issue_num}"
            print(f"  [github] Created #{issue_num}")
        else:
            print(f"  [github] Failed to create issue for: {task.title}")

    for task in changes["updated"]:
        if task.issue_number == "(pending)" or dry_run:
            if dry_run:
                print(f"  [dry-run] Would update issue: {task.title}")
            continue

        issue_num = task.issue_number.lstrip("#")
        print(f"  [github] Updating #{issue_num}: {task.title}")
        edit_issue(
            issue_number=issue_num,
            title=task.title,
            body=format_issue_body(task),
            label=task.label,
            previous_label=task.previous_label,
        )

    for task in changes["cancelled"]:
        if task.issue_number == "(pending)" or dry_run:
            if dry_run:
                print(f"  [dry-run] Would close issue: {task.title}")
            continue

        issue_num = task.issue_number.lstrip("#")
        print(f"  [github] Closing #{issue_num}: {task.title} (cancelled)")
        close_issue(issue_num)

    # Retry issue creation for tasks stuck at (pending) from prior failures
    for task in changes["unchanged"]:
        if task.issue_number == "(pending)" and task.status == "draft":
            if dry_run:
                print(f"  [dry-run] Would retry issue creation: {task.title}")
                continue

            print(f"  [github] Retrying issue creation: {task.title}")
            issue_num = create_issue(
                title=task.title,
                body=format_issue_body(task),
                label=task.label,
            )
            if issue_num:
                task.issue_number = f"#{issue_num}"
                print(f"  [github] Created #{issue_num}")


def handle_stabilization(unchanged_tasks: list[Task], dry_run: bool = False):
    """Auto-stabilize tasks that haven't changed for N cycles."""
    for task in unchanged_tasks:
        if task.unchanged_cycles >= STABILIZE_AFTER_CYCLES and task.status == "draft":
            print(f"  [stabilize] TASK-{task.id}: {task.title} — stable after {task.unchanged_cycles} cycles")
            task.status = "open"
            task.is_draft_tag = False

            if task.issue_number != "(pending)" and not dry_run:
                issue_num = task.issue_number.lstrip("#")
                remove_label(issue_num, "draft")
                print(f"  [github] Removed 'draft' label from #{issue_num}")


def run_cycle(source_dir: Path, dry_run: bool = False) -> bool:
    """Run one extraction cycle. Returns True if transcripts were found."""

    # 1. Read transcripts
    transcript_text = read_transcripts(source_dir)
    if not transcript_text:
        return False

    # 2. Token safety check
    if len(transcript_text) > MAX_CHARS:
        print("  [ERROR] Transcript exceeds 80k token limit! Stopping extraction.")
        print("  [ERROR] Tasks preserved as-is. Send bot message to meeting chat.")
        return False

    # 3. Read current tasks
    current_md = read_tasks_md()
    old_tasks = parse_tasks(current_md) if current_md else []

    # 4. Call extractor
    print("  [extract] Calling gpt-4.1-nano...")
    start = time.time()
    new_md = extract_tasks(transcript_text, current_md)
    elapsed = time.time() - start

    # Handle API failure — preserve existing tasks
    if new_md is None:
        print(f"  [extract] API call failed after {elapsed:.2f}s — preserving existing tasks")
        return True

    print(f"  [extract] Done in {elapsed:.2f}s")

    # 5. Parse new tasks
    new_tasks = parse_tasks(new_md)

    if not new_tasks:
        if old_tasks:
            print("  [extract] Extractor returned no parseable tasks — preserving existing tasks")
            return True

        print("  [extract] No tasks extracted")
        return True

    # 6. Diff (also preserves old tasks dropped by AI)
    changes = diff_tasks(old_tasks, new_tasks if new_tasks else [])

    added_count = len(changes["added"])
    updated_count = len(changes["updated"])
    cancelled_count = len(changes["cancelled"])
    unchanged_count = len(changes["unchanged"])

    print(f"  [diff] +{added_count} new, ~{updated_count} updated, x{cancelled_count} cancelled, ={unchanged_count} unchanged")

    # 7. GitHub ops
    handle_github_ops(changes, dry_run)

    # 8. Auto-stabilization
    handle_stabilization(changes["unchanged"], dry_run)

    # 9. Rebuild task list with updated state (issue numbers, stabilization)
    all_tasks = changes["added"] + changes["updated"] + changes["cancelled"] + changes["unchanged"]
    all_tasks.sort(key=lambda t: t.id)

    # Write updated tasks.md
    header = f"# Meeting Tasks — {datetime.now().strftime('%Y-%m-%d')}\n\n"
    write_tasks_md(header + tasks_to_md(all_tasks))

    print(f"  [write] Updated {TASKS_FILE}")
    return True


def main():
    parser = argparse.ArgumentParser(description="HackAI meeting task extraction orchestrator")
    parser.add_argument("--interval", type=int, default=5, help="Seconds between extraction cycles (default: 5)")
    parser.add_argument("--dry-run", action="store_true", help="Skip GitHub operations")
    parser.add_argument("--once", action="store_true", help="Run one cycle and exit")
    parser.add_argument("--fake", action="store_true", help="Use fake data from data/fake/ instead of data/transcripts/")
    args = parser.parse_args()

    source_dir = FAKE_DATA_DIR if args.fake else TRANSCRIPTS_DIR

    print(f"=== HackAI Orchestrator ===")
    print(f"Source: {source_dir}")
    print(f"Tasks: {TASKS_FILE}")
    print(f"Interval: {args.interval}s")
    print(f"Dry run: {args.dry_run}")
    print(f"===========================\n")

    if args.once:
        print(f"[cycle] Running single extraction...")
        run_cycle(source_dir, args.dry_run)
        return

    cycle = 0
    while True:
        cycle += 1
        print(f"[cycle {cycle}] {datetime.now().strftime('%H:%M:%S')}")

        try:
            has_data = run_cycle(source_dir, args.dry_run)
            if not has_data:
                print("  [wait] No transcripts found, waiting...")
        except KeyboardInterrupt:
            print("\n[stop] Shutting down gracefully.")
            break
        except Exception as e:
            print(f"  [error] {e}")

        print()
        try:
            time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\n[stop] Shutting down gracefully.")
            break


if __name__ == "__main__":
    main()
