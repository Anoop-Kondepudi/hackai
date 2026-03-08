# Meeting Bot (Nishil)

Joins a live meeting call and captures audio.

## Responsibilities
- Join a meeting via invite link (Google Meet / Zoom / Teams)
- Capture the audio stream
- Pipe raw audio to the transcription engine
- Handle bot lifecycle: join, listen, leave

## Output
Raw audio files or audio stream → consumed by `transcription/`

## Key Decisions
- Which platform to target first
- Open-source options: Recall.ai SDK, Pipecat, or raw browser automation
