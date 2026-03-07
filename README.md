# HackAI

Meeting-to-PR pipeline. A bot joins a meeting, transcribes the conversation, extracts action items, creates GitHub issues with AI-generated implementation plans, and opens PRs — all automatically.

**Flow:** Live Meeting → Audio Capture → Transcription → Task Extraction → GitHub Issues → AI Plan → PR

## Repo Structure

| Folder | Owner | Description |
|--------|-------|-------------|
| `bot/` | Nishil | Meeting bot — joins calls, captures audio |
| `transcription/` | Shiv | Audio → text chunks with speaker detection |
| `pipeline/` | Anoop | Transcript → actionable task extraction |
| `backend/` | Anoop | GitHub issue creation, AI plans, PR generation |
| `dashboard/` | Anoop | Real-time monitoring UI |
| `shared/` | Everyone | Data contracts (schemas) and config |
| `data/` | Runtime | Audio, transcripts, tasks, issue status (gitignored) |
| `docs/` | Everyone | Plans and design docs |

## Data Flow

```
bot/ → raw audio → transcription/ → { speaker, text, timestamp } → pipeline/ → extracted tasks → backend/ → GitHub issues + PRs
                                                                                                       ↓
                                                                                                  dashboard/ (reads all state)
```

Contracts between stages are defined in `shared/schemas/`.

## Setup

```bash
git clone https://github.com/Anoop-Kondepudi/hackai.git
cd hackai
cp shared/config/.env.example .env
# Fill in your API keys in .env
```

## How We Work

- Everyone works on `main`
- Each person works in their own folder(s) — folder separation prevents conflicts
- If a data contract in `shared/schemas/` needs to change, coordinate with the team
- See `docs/plans/plan.md` for the full project plan
