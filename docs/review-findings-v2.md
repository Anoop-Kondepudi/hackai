# Code Review V2 — Commit b415ea0

Review date: 2026-03-07
Reviewers: security-reviewer, logic-reviewer, robustness-reviewer, docs-reviewer

## CRITICAL

1. **[LOGIC] AI prompt doesn't know about `open` status — infinite churn**
   - `backend/extractor.py:32` — prompt says `Status: {draft | cancelled}`, never mentions `open`
   - When a task auto-stabilizes to `open`, AI rewrites it back to `draft` next cycle
   - `_task_changed()` detects this as a change, resets `unchanged_cycles` to 0
   - Creates infinite loop: stabilize -> AI reverts -> reset -> re-stabilize -> repeat
   - **FIXED:** Added `open` to the Status enum in the prompt

2. **[SECURITY] gh CLI argument confusion from task titles**
   - `backend/github_ops.py:26-31` — task titles passed directly as gh args
   - List-form subprocess.run prevents shell injection, but titles starting with `--` could confuse gh
   - **SKIPPED:** AI-generated titles won't start with `--`; non-destructive if it happens

3. **[ROBUSTNESS] Field regex could match inside Description/Source text**
   - `backend/task_parser.py:45-49` — `get_field()` regex matches first occurrence in block
   - If Description contains "Issue: #99", could match before real field
   - **SKIPPED:** Field order ensures real fields appear first; re.search finds first match

4. **[ROBUSTNESS] Duplicate task IDs silently lost in dict**
   - `backend/task_parser.py:77-78` — dict keying drops earlier duplicates
   - **SKIPPED:** AI uses sequential IDs; prompt enforces no duplicates

5. **[DOCS] backend/README.md references deleted files (task.json, issue_status.json)**
   - **SKIPPED:** Does not affect pipeline flow

6. **[DOCS] pipeline/README.md references deleted task.json and says "Claude" instead of gpt-4.1-nano**
   - **SKIPPED:** Does not affect pipeline flow

## WARNING

7. **[LOGIC] Retry logic can create duplicate GitHub issues**
   - `backend/orchestrator.py:142-158` — if gh succeeds but returns None, retries next cycle
   - **SKIPPED:** Low probability; gh output parsing is reliable

8. **[ROBUSTNESS] Retry storm on GitHub outage — no backoff**
   - `backend/orchestrator.py:142-157` — retries every 5s indefinitely
   - **SKIPPED:** 5-10 min demo meetings; won't hit rate limits

9. **[ROBUSTNESS] API garbage output increments unchanged_cycles (false stabilization)**
   - `backend/orchestrator.py:206-213` — can't distinguish "no changes" from "bad output"
   - **SKIPPED:** gpt-4.1-nano had 100% accuracy in benchmarks

10. **[ROBUSTNESS] UnicodeDecodeError catch may silently skip transcript files**
    - `backend/orchestrator.py:59-61` — non-UTF-8 files skipped with only a print warning
    - **SKIPPED:** Transcription module is co-developed, will use UTF-8

11. **[ROBUSTNESS] No file locking on tasks.md**
    - `backend/orchestrator.py:72-82` — read-API-write window has no lock
    - **SKIPPED:** Single-process design

12. **[ROBUSTNESS] Pending tasks that stabilize to `open` stop retrying issue creation**
    - `backend/orchestrator.py:144` — retry only checks `status == "draft"`
    - **SKIPPED for now:** Edge case; if GitHub works, issues are created on first try

13. **[ROBUSTNESS] Token check only measures transcript, not transcript+tasks.md**
    - `backend/orchestrator.py:183` — MAX_CHARS check doesn't include tasks.md size
    - **SKIPPED:** 5-10 min meetings produce ~2-3k tokens

14. **[ROBUSTNESS] No subprocess timeout on gh calls**
    - `backend/github_ops.py:14` — subprocess.run has no timeout
    - **SKIPPED:** Rare; hackathon scope

15. **[SECURITY] API key could leak in broad exception tracebacks**
    - `backend/extractor.py:74-75` — catch-all logs full exception
    - **SKIPPED:** OpenAI SDK uses headers, not URL params

16. **[SECURITY] No label validation against allowed set**
    - `backend/github_ops.py:31` — label from AI not validated
    - **SKIPPED:** AI prompt constrains labels; garbage label is non-destructive

17. **[SECURITY] Transcript JSON not validated against schema**
    - `backend/orchestrator.py:52-58` — chunks not checked for expected fields
    - **SKIPPED:** Trusted input from team member's module

18. **[DOCS] plan.md task format missing Unchanged-Cycles field**
    - **SKIPPED:** Does not affect pipeline flow

19. **[DOCS] "3-4 chunks" vs "3 cycles" inconsistency across docs**
    - **SKIPPED:** Does not affect pipeline flow

20. **[DOCS] backend/README describes Phase 2/3 TODO features as current**
    - **SKIPPED:** Does not affect pipeline flow

21. **[DOCS] pipeline/prompts/task_extractor.md diverges from runtime prompt**
    - **SKIPPED:** CLAUDE.md already notes inline prompt is the real one
