"""Parse tasks.md into structured objects and diff old vs new."""

import re
from dataclasses import dataclass


@dataclass
class Task:
    id: int
    title: str
    issue_number: str  # "(pending)" or "#42"
    status: str  # "draft" or "cancelled"
    label: str
    last_updated: str
    description: str
    source: str
    is_draft_tag: bool  # whether [DRAFT] is in the header
    unchanged_cycles: int = 0  # for auto-stabilization


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
        if task_id not in old_by_id:
            added.append(new_task)
        elif new_task.status == "cancelled" and old_by_id[task_id].status != "cancelled":
            cancelled.append(new_task)
        elif _task_changed(old_by_id[task_id], new_task):
            updated.append(new_task)
        else:
            new_task.unchanged_cycles = old_by_id[task_id].unchanged_cycles + 1
            unchanged.append(new_task)

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
        lines.append(f"Description: {t.description}")
        lines.append(f"Source: {t.source}")
        lines.append("")
    return "\n".join(lines)
