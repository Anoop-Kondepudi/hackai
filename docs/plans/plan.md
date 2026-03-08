# HackAI — Meeting-to-PR Pipeline

## Concept

A meeting bot joins a call, listens to the conversation, and automatically creates GitHub issues from action items discussed. An AI agent replies on each issue with an implementation plan. The agent then pushes a PR with the changes. A real-time dashboard monitors everything as it happens. Fully agentic — no human triaging.

**Flow:** Live Meeting → Audio Capture → Transcription → Task Extraction → GitHub Issues (draft) → Auto-stabilize → AI Plan → PR → Dashboard

## Architecture

Monorepo with folder-based ownership. Everyone works on `main`, each person owns their folder(s). Folder separation prevents conflicts.

```
hackai/
├── bot/                  ← Nishil
├── transcription/        ← Shiv
├── pipeline/             ← Anoop (prompts + extraction logic)
├── backend/              ← Anoop (orchestration, GitHub, Claude CLI)
├── dashboard/            ← Anoop (monitoring UI)
├── shared/schemas/       ← Everyone (contracts)
├── shared/config/        ← Everyone (env config)
├── data/                 ← Runtime (gitignored)
└── docs/                 ← Everyone
```

## Pipeline Design

### Stateless Architecture
- Every model call is independent — no sessions, no persistent connections
- Full transcript + full `tasks.md` sent every call
- `tasks.md` is the single source of truth (the memory)
- gpt-4.1-nano via OpenAI API for extraction (~3.5s per call), stronger model for planning

### Three Phases

**Phase 1: Task Extractor** (every 5 sec, configurable)
- Input: full transcript + tasks.md
- Output: updated tasks.md
- Creates GitHub issues immediately with `draft` label
- Updates issues as tasks evolve during meeting
- Relevance checking: resets stabilization counter if task is still being discussed
- Auto-stabilizes tasks after 3 unchanged cycles → `draft` → `planning`
- MEETING_ENDED signal: immediately finalizes all remaining drafts
- Code: `backend/extractor.py`, `backend/relevance.py`, `backend/orchestrator.py`

**Phase 2: Plan Generator** (triggered when task stabilizes)
- Input: task details + repo file tree
- Output: implementation plan posted as issue comment
- Model: GPT-5.4 via Codex CLI (xhigh reasoning)
- Concurrent: runs in background threads, non-blocking to extraction loop
- On failure: posts comment explaining why, reverts to `draft` for retry
- Code: `backend/plan_generator.py`

**Phase 3: PR Creator** (triggered after plan, chained in same thread)
- Phase 3.1 — Sanity check: Codex evaluates if plan is implementable in this codebase
  - Not actionable → closes issue with explanation, status → `cancelled`
- Phase 3.2 — Implementation: Codex generates code in an isolated git worktree
  - Creates branch `hackai-TASK-{id}`, commits, pushes, opens PR via `gh pr create`
  - On failure → posts comment, reverts to `planned` for retry
- Code: `backend/pr_creator.py`

### Task File Format (`data/tasks/tasks.md`)
```
## TASK-1: Fix Google OAuth login [DRAFT]
Issue: #42
Status: draft
Label: bug
Last-Updated: 14:00:18
Description: Google OAuth login broken. Redirect URI wrong in production.
Source: "The auth system is completely broken..." (Shiv, 14:00:05)
```

Fields: ID, Title, Issue number, Status, Label, Last-Updated, Unchanged-Cycles, Description, Source.
No assignee, no priority — fully agentic pipeline handles everything.

### Status Lifecycle
```
draft → planning → planned → implementing → pr-open
                                    ↘ cancelled (sanity check fails)
```

### Token Safety
- Hard stop at 80k tokens — preserve tasks.md, send message via bot
- 5-10 min meetings (~2-3k tokens) will not hit this limit

## Data Flow & Contracts

```
bot/           →  raw audio files/stream
                      ↓
transcription/ →  TranscriptChunk { speaker, text, timestamp }
                      ↓
pipeline/      →  tasks.md (shared state file)
                      ↓
backend/       →  GitHub issues + plans + PRs
                      ↓
dashboard/     →  reads tasks.md + GitHub state, displays live
```

### Where data lives

Designed for the messiest case — works with local files, can be swapped to Supabase/SQLite if needed.

- `data/audio/` — raw audio from bot (consumed by transcription)
- `data/transcripts/` — JSON transcript chunks (consumed by pipeline)
- `data/tasks/tasks.md` — shared task state (read/written by all pipeline phases)
- Issue tracking is done via the `Issue:` field in tasks.md and `gh` CLI

## Team Responsibilities

### Nishil — Meeting Bot (`bot/`)

**Goal:** Get a bot into a live call that captures audio.

- Join a meeting via invite link (Google Meet / Zoom / Teams)
- Capture the audio stream
- Pipe raw audio to transcription (local file or stream)
- Handle bot lifecycle: join, listen, leave
- Support sending messages to the meeting chat (for bot notifications)

**Output:** Raw audio → `data/audio/` or direct stream to transcription

### Shiv — Transcription (`transcription/`)

**Goal:** Turn live meeting audio into text chunks in real time.

- Receive audio from bot
- Implement speaker diarization (demo-level)
- Transcribe audio → text in configurable chunks (3-5 sec window)
- Write TranscriptChunk JSON to `data/transcripts/`

**Output:** `{ speaker, text, timestamp }` JSON files

### Anoop — Pipeline, Backend, Dashboard

**Goal:** Turn transcripts into GitHub issues with AI plans and auto-generated PRs.

- **Pipeline:** Task extraction prompts and logic
- **Backend:** Orchestration script, GitHub operations, Claude Code CLI calls
- **Dashboard:** Real-time monitoring UI reading from `data/`

## Integration Points

```
Nishil (bot audio) → Shiv (transcription) → Anoop (pipeline → backend → dashboard)
```

- **Nishil → Shiv:** Raw audio stream or files in `data/audio/`
- **Shiv → Anoop:** TranscriptChunk JSON in `data/transcripts/`
- Contracts defined in `shared/schemas/`

## Running Locally

Everything runs locally. No deployment needed.

- Bot runs on local machine (headless browser or SDK)
- Transcription runs locally (Whisper) or calls a cloud API
- Pipeline + Backend are local scripts calling fast models + Claude Code CLI
- Dashboard is a local web UI (dev server)
- GitHub interactions use `gh` CLI or API with a personal access token

## MVP Milestones

| # | Milestone | Owner | Status |
|---|-----------|-------|--------|
| 1 | Bot joins a call and captures audio | Nishil | In progress |
| 2 | Audio transcribed to text in real time | Shiv | In progress |
| 3 | Transcription → extracted tasks → GitHub issues (draft) | Anoop | **Done** |
| 4 | Tasks auto-stabilize and AI posts implementation plan | Anoop | **Done** |
| 5 | Plan → PR with code changes | Anoop | **Done** |
| 6 | Dashboard UI showing live pipeline status | Anoop | Not started |

## Open Questions

- [ ] Which meeting platform to target first (Google Meet likely easiest)
- [ ] Whisper (fully local) vs cloud transcription API
- [ ] Data storage: flat JSON files vs SQLite vs Supabase (start with JSON, upgrade if needed)
- [ ] Target repo for generated PRs — this repo or a separate demo repo?
