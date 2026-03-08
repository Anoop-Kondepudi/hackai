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

A lightweight local websocket server is available at `backend/meeting-audio-backend.js` for extension-driven live transcription with ElevenLabs Speech-to-Text (chunked via local ffmpeg capture).

### Run

```bash
cd backend
npm install
ELEVENLABS_API_KEY=your_key_here npm start
# optional
# ELEVENLABS_MODEL_ID=scribe_v1 npm start
# TRANSCRIPTION_CHUNK_MS=5000 npm start
```

The server listens on `ws://localhost:3001` (or `PORT` if set) and prints transcripts to stdout.

## Local Node-only transcription (no Chrome extension)

If you want to drop the extension and transcribe directly from local audio input, run:

```bash
cd backend
ELEVENLABS_API_KEY=your_key_here npm run transcribe:local
```

This script (`local-audio-transcriber.js`) uses `ffmpeg` to read local audio input and chunks PCM audio and sends each chunk to ElevenLabs Speech-to-Text.

### Optional environment variables

```bash
# defaults by OS: macOS=avfoundation, Linux=pulse, Windows=dshow
AUDIO_INPUT_FORMAT=avfoundation

# primary input device defaults by OS:
# macOS=:0, Linux=default, Windows=audio=CABLE Output (VB-Audio Virtual Cable)
AUDIO_INPUT_DEVICE=:0

# optional secondary input mixed with primary (Windows default shown)
# set empty to disable mixing
AUDIO_INPUT_DEVICE_2=audio=Microphone (2- Realtek(R) Audio)

# defaults to 16000
AUDIO_SAMPLE_RATE=16000

# defaults to scribe_v1
ELEVENLABS_MODEL_ID=scribe_v1

# optional language hint (example: en)
ELEVENLABS_LANGUAGE_CODE=en

# defaults to 5000 (5s chunks)
TRANSCRIPTION_CHUNK_MS=5000
```

> Note: `ffmpeg` must be installed and available in your PATH.
