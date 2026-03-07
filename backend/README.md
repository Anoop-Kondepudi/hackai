# Backend (Anoop)

Orchestrates GitHub issue creation, AI planning, and PR generation.

## Responsibilities
- Read tasks from `data/tasks/`
- Create GitHub issues via `gh` CLI or GitHub API
- Run Claude Code (headless CLI) to generate implementation plans
- Post plans as issue comments
- On approval, run Claude Code to generate code and open PRs
- Track status in `data/issues/` matching `shared/schemas/issue_status.json`

## Input
Task JSON from `shared/schemas/task.json`

## Output
IssueStatus JSON matching `shared/schemas/issue_status.json`

## Local meeting transcription websocket

A lightweight local websocket server is available at `backend/meeting-audio-backend.js` for extension-driven live transcription with AssemblyAI Streaming (v3 websocket API).

### Run

```bash
cd backend
npm install
ASSEMBLYAI_API_KEY=your_key_here npm start
# optional
# ASSEMBLYAI_SPEECH_MODEL=universal-streaming-multilingual npm start
```

The server listens on `ws://localhost:3001` (or `PORT` if set) and prints transcripts to stdout.
