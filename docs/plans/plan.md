# HackAI — Meeting-to-PR Pipeline

## Concept

A meeting bot joins a call, listens to the conversation, and automatically creates GitHub issues from action items discussed. An AI agent replies on each issue with an implementation plan. With one click, the agent pushes a PR with the changes. A real-time dashboard monitors everything as it happens.

**Flow:** Live Meeting → Audio Capture → Transcription → Task Extraction → GitHub Issues → AI Plan → Approved PR → Dashboard

## Architecture

Monorepo with folder-based ownership. Everyone works on `main`, each person owns their folder(s). No feature branches needed — folder separation prevents conflicts.

```
hackai/
├── bot/                  ← Nishil
├── transcription/        ← Shiv
├── pipeline/             ← Anoop
├── backend/              ← Anoop
├── dashboard/            ← Anoop
├── shared/schemas/       ← Everyone (contracts)
├── shared/config/        ← Everyone (env config)
├── data/                 ← Runtime (gitignored)
└── docs/                 ← Everyone
```

## Data Flow & Contracts

Each stage reads input from the previous stage and writes output for the next. The contracts are defined as JSON schemas in `shared/schemas/`.

```
bot/          →  raw audio files/stream
                     ↓
transcription/ →  TranscriptChunk { speaker, text, timestamp }
                     ↓
pipeline/      →  Task { id, title, description, source_speaker, source_text, status }
                     ↓
backend/       →  IssueStatus { task_id, github_issue_url, status, plan, pr_url }
                     ↓
dashboard/     →  reads all of the above and displays live status
```

### Where data lives

Designed for the messiest case — works with local files, can be swapped to Supabase/SQLite if needed.

- `data/audio/` — raw audio from bot (consumed by transcription)
- `data/transcripts/` — JSON transcript chunks (consumed by pipeline)
- `data/tasks/` — JSON extracted tasks (consumed by backend)
- `data/issues/` — JSON issue tracking (consumed by dashboard)

## Team Responsibilities

### Nishil — Meeting Bot (`bot/`)

**Goal:** Get a bot into a live call that captures audio.

- Research open-source meeting bots (Google Meet, Zoom, Teams)
- Bot joins a meeting via invite link, captures audio stream
- Pipe raw audio to transcription (local file or stream)
- Handle bot lifecycle: join, listen, leave

**Output:** Raw audio → `data/audio/` or direct stream to transcription
**Key decisions:** Which platform first, Recall.ai vs Pipecat vs browser automation

### Shiv — Transcription (`transcription/`)

**Goal:** Turn live meeting audio into text chunks in real time.

- Receive audio from bot
- Implement speaker diarization (demo-level is fine)
- Transcribe audio → text in configurable chunks (3-5 sec window)
- Write TranscriptChunk JSON to `data/transcripts/`

**Output:** `{ speaker, text, timestamp }` JSON files
**Key decisions:** Whisper (local) vs Deepgram vs AssemblyAI

### Anoop — Pipeline, Backend, Dashboard (`pipeline/`, `backend/`, `dashboard/`)

**Goal:** Turn transcripts into GitHub issues with AI plans and auto-generated PRs.

#### Pipeline (`pipeline/`)
- Read transcript chunks from `data/transcripts/`
- Use Claude API to extract actionable tasks from conversation
- Write Task JSON to `data/tasks/`

#### Backend (`backend/`)
- Read tasks from `data/tasks/`
- Create GitHub issues via `gh` CLI or GitHub API
- Run Claude Code in headless mode to generate implementation plans
- Post plans as comments on the issues
- On approval, run Claude Code to generate code and open PRs
- Track everything in `data/issues/` as IssueStatus JSON

#### Dashboard (`dashboard/`)
- Real-time monitoring UI
- Show transcript chunks as they arrive
- Display extracted tasks and their pipeline status
- Show GitHub issues, AI plans, and PR status
- Reads from `data/` directory (polling or file watching)

## Integration Points

```
Nishil (bot audio) → Shiv (transcription) → Anoop (pipeline → backend → dashboard)
```

- **Nishil → Shiv:** Raw audio stream or files in `data/audio/`
- **Shiv → Anoop:** TranscriptChunk JSON in `data/transcripts/`
- Contracts defined in `shared/schemas/` — agree on these early so everyone can work in parallel

## Running Locally

Everything runs locally. No deployment needed.

- Bot runs on local machine (headless browser or SDK)
- Transcription runs locally (Whisper) or calls a cloud API
- Pipeline + Backend are local scripts that call Claude Code CLI in headless mode
- Dashboard is a local web UI (dev server)
- GitHub interactions use `gh` CLI or API with a personal access token

## MVP Milestones

| # | Milestone | Owner |
|---|-----------|-------|
| 1 | Bot joins a call and captures audio | Nishil |
| 2 | Audio transcribed to text in real time | Shiv |
| 3 | Transcription → extracted tasks → GitHub issues | Anoop |
| 4 | AI agent posts implementation plan on issue | Anoop |
| 5 | Approved plan → PR with code changes | Anoop |
| 6 | Dashboard UI showing live pipeline status | Anoop |

## Open Questions

- [ ] Which meeting platform to target first (Google Meet likely easiest)
- [ ] Whisper (fully local) vs cloud transcription API
- [ ] Data storage: flat JSON files vs SQLite vs Supabase (start with JSON, upgrade if needed)
- [ ] How does the "approval" step work — manual click in dashboard? GitHub reaction on the comment?
- [ ] Target repo for generated PRs — this repo or a separate demo repo?
