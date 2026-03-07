"""GitHub operations via gh CLI."""

import subprocess
import os
import logging

log = logging.getLogger(__name__)

REPO = os.getenv("GITHUB_REPO", "Anoop-Kondepudi/hackai")
CATEGORY_LABELS = {"bug", "feature", "refactor", "improvement"}


def run_gh(args: list[str]) -> tuple[int, str, str]:
    """Run a gh CLI command and return (exit_code, stdout, stderr)."""
    result = subprocess.run(
        ["gh"] + args,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0 and result.stderr:
        log.warning(f"gh command failed: {' '.join(args[:3])}... stderr: {result.stderr.strip()}")
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def create_issue(title: str, body: str, label: str) -> str | None:
    """Create a GitHub issue with draft label. Returns issue number or None."""
    code, stdout, stderr = run_gh([
        "issue", "create",
        "--repo", REPO,
        "--title", title,
        "--body", body,
        "--label", f"draft,{label}",
    ])
    if code == 0 and stdout:
        # gh returns the issue URL, extract the number
        parts = stdout.strip().split("/")
        return parts[-1] if parts else None
    if stderr:
        log.error(f"Failed to create issue '{title}': {stderr}")
    return None


def edit_issue(
    issue_number: str,
    title: str,
    body: str,
    label: str,
    previous_label: str = "",
):
    """Update an existing GitHub issue's title, body, and label."""
    args = [
        "issue", "edit", issue_number,
        "--repo", REPO,
        "--title", title,
        "--body", body,
    ]

    if previous_label and previous_label != label and previous_label in CATEGORY_LABELS:
        args.extend(["--remove-label", previous_label])

    args.extend(["--add-label", label])
    run_gh(args)


def close_issue(issue_number: str):
    """Close a GitHub issue."""
    run_gh([
        "issue", "close", issue_number,
        "--repo", REPO,
    ])


def remove_label(issue_number: str, label: str):
    """Remove a label from an issue."""
    run_gh([
        "issue", "edit", issue_number,
        "--repo", REPO,
        "--remove-label", label,
    ])


def add_label(issue_number: str, label: str):
    """Add a label to an issue."""
    run_gh([
        "issue", "edit", issue_number,
        "--repo", REPO,
        "--add-label", label,
    ])
