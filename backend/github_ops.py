"""GitHub operations via gh CLI."""

import subprocess
import os

REPO = os.getenv("GITHUB_REPO", "Anoop-Kondepudi/hackai")


def run_gh(args: list[str]) -> tuple[int, str]:
    """Run a gh CLI command and return (exit_code, output)."""
    result = subprocess.run(
        ["gh"] + args,
        capture_output=True,
        text=True,
    )
    return result.returncode, result.stdout.strip()


def create_issue(title: str, body: str, label: str) -> str | None:
    """Create a GitHub issue with draft label. Returns issue number or None."""
    code, output = run_gh([
        "issue", "create",
        "--repo", REPO,
        "--title", title,
        "--body", body,
        "--label", f"draft,{label}",
    ])
    if code == 0 and output:
        # gh returns the issue URL, extract the number
        parts = output.strip().split("/")
        return parts[-1] if parts else None
    return None


def edit_issue(issue_number: str, title: str, body: str, label: str):
    """Update an existing GitHub issue's title and body."""
    run_gh([
        "issue", "edit", issue_number,
        "--repo", REPO,
        "--title", title,
        "--body", body,
    ])


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
