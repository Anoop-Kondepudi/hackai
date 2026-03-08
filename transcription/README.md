# Transcription Engine (Shiv)

Turns live meeting audio into usable text chunks.

## Responsibilities
- Receive audio from the meeting bot
- Implement speaker diarization (demo-level)
- Transcribe audio to text in configurable chunks (3-5 sec window)
- Output transcript chunks matching `shared/schemas/transcript_chunk.json`

## Output
JSON files written to `data/transcripts/` (or equivalent) matching the TranscriptChunk schema:
```json
{ "speaker": "Anoop", "text": "We need to add auth to the API", "timestamp": "2026-03-07T14:30:00Z" }
```

## Key Decisions
- Whisper (local) vs Deepgram vs ElevenLabs
- How to handle speaker diarization
