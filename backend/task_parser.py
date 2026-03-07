"""Parse tasks.md into structured objects and diff old vs new."""

import re
from dataclasses import dataclass


@dataclass
class Task:
    id: int
    title: str
    issue_number: str  # "(pending)" or "#42"
    status: str  # "draft", "cancelled", or "open"
    label: str
    last_updated: str
    description: str
    source: str
    is_draft_tag: bool  # whether [DRAFT] is in the header
    unchanged_cycles: int = 0  # for auto-stabilization
    previous_label: str = ""  # transient GitHub sync metadata, not persisted


def parse_tasks(md_content: str) -> list[Task]:
    """Parse a tasks.md string into a list of Task objects."""
    tasks = []
    # Split on task headers
    blocks = re.split(r"(?=^## TASK-\d+:)", md_content, flags=re.MULTILINE)

    for block in blocks:
        block = block.strip()
        if not block.startswith("## TASK-"):
            continue

        # Parse header: ## TASK-1: Fix something [DRAFT]
        header_match = re.match(
            r"^## TASK-(\d+):\s*(.+?)(?:\s*\[(DRAFT|CANCELLED)\])?\s*$",
            block.split("\n")[0],
        )
        if not header_match:
            continue

        task_id = int(header_match.group(1))
        title = header_match.group(2).strip()
        tag = header_match.group(3) or ""

        # Parse fields
        def get_field(name):
            match = re.search(
                rf"^{name}:\s*(.+)$", block, re.MULTILINE | re.IGNORECASE
            )
            return match.group(1).strip() if match else ""

        # Parse unchanged_cycles if persisted
        cycles_str = get_field("Unchanged-Cycles")
        cycles = int(cycles_str) if cycles_str.isdigit() else 0

        tasks.append(
            Task(
                id=task_id,
                title=title,
                issue_number=get_field("Issue"),
                status=get_field("Status"),
                label=get_field("Label"),
                last_updated=get_field("Last-Updated"),
                description=get_field("Description"),
                source=get_field("Source"),
                is_draft_tag=tag == "DRAFT",
                unchanged_cycles=cycles,
            )
        )

    return tasks


def diff_tasks(
    old_tasks: list[Task], new_tasks: list[Task]
) -> dict[str, list[Task]]:
    """Compare old and new task lists, return categorized changes."""
    old_by_id = {t.id: t for t in old_tasks}
    new_by_id = {t.id: t for t in new_tasks}

    added = []
    updated = []
    cancelled = []
    unchanged = []

    for task_id, new_task in new_by_id.items():
        old_task = old_by_id.get(task_id)

        # Carry forward issue_number from old task (AI doesn't know about GitHub)
        if old_task and old_task.issue_number and old_task.issue_number != "(pending)":
            new_task.issue_number = old_task.issue_number

        if old_task is None:
            added.append(new_task)
        elif new_task.status == "cancelled" and old_task.status != "cancelled":
            cancelled.append(new_task)
        elif _task_changed(old_task, new_task):
            new_task.unchanged_cycles = 0
            new_task.previous_label = old_task.label
            updated.append(new_task)
        else:
            new_task.unchanged_cycles = old_task.unchanged_cycles + 1
            unchanged.append(new_task)

    # Preserve old tasks that the AI dropped (prevent silent data loss)
    for task_id, old_task in old_by_id.items():
        if task_id not in new_by_id:
            old_task.unchanged_cycles += 1
            unchanged.append(old_task)

    return {
        "added": added,
        "updated": updated,
        "cancelled": cancelled,
        "unchanged": unchanged,
    }


def _task_changed(old: Task, new: Task) -> bool:
    """Check if a task was meaningfully updated."""
    return (
        old.title != new.title
        or old.description != new.description
        or old.label != new.label
        or old.last_updated != new.last_updated
        or old.status != new.status
    )


def tasks_to_md(tasks: list[Task]) -> str:
    """Convert a list of Task objects back to markdown."""
    lines = []
    for t in tasks:
        tag = "[DRAFT]" if t.status == "draft" and t.is_draft_tag else ""
        if t.status == "cancelled":
            tag = "[CANCELLED]"
        lines.append(f"## TASK-{t.id}: {t.title} {tag}".rstrip())
        lines.append(f"Issue: {t.issue_number}")
        lines.append(f"Status: {t.status}")
        lines.append(f"Label: {t.label}")
        lines.append(f"Last-Updated: {t.last_updated}")
        lines.append(f"Unchanged-Cycles: {t.unchanged_cycles}")
        lines.append(f"Description: {t.description}")
        lines.append(f"Source: {t.source}")
        lines.append("")
    return "\n".join(lines)
