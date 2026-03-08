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

## Local Node-only transcription

Run local audio transcription (no Chrome extension required):

```bash
cd backend
npm install
ASSEMBLYAI_API_KEY=your_key_here npm start
# equivalent
# ASSEMBLYAI_API_KEY=your_key_here npm run transcribe:local
```

This script (`local-audio-transcriber.js`) uses `ffmpeg` to read local audio input and streams PCM audio to AssemblyAI Streaming v3.

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

# defaults to universal-streaming-multilingual
ASSEMBLYAI_SPEECH_MODEL=universal-streaming-multilingual

# defaults to true
ASSEMBLYAI_SPEAKER_LABELS=true

# optional diarization hint (1-10)
ASSEMBLYAI_MAX_SPEAKERS=2
```

> Note: `ffmpeg` must be installed and available in your PATH.
