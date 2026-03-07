"""
Transcription module using AssemblyAI.

Provides:
- File-based transcription
- Built-in summarization
- Utility to save TranscriptChunk JSON files for the downstream pipeline

All functions are designed to be imported and used in FastAPI routes.
"""

import os
import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

import assemblyai as aai
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

# Load .env from project root or shared/config
_project_root = Path(__file__).resolve().parent.parent
_env_path = _project_root / ".env"
if not _env_path.exists():
    _env_path = _project_root / "shared" / "config" / ".env"
load_dotenv(_env_path)

ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY", "")
if not ASSEMBLYAI_API_KEY:
    raise EnvironmentError(
        "ASSEMBLYAI_API_KEY is not set. "
        "Add it to .env at the project root or shared/config/.env"
    )

aai.settings.api_key = ASSEMBLYAI_API_KEY

DATA_TRANSCRIPTS_DIR = _project_root / "data" / "transcripts"
DATA_TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_transcript_chunk(text: str, start_ms: int, end_ms: int) -> dict:
    """Build a TranscriptChunk dict matching shared/schemas/transcript_chunk.json."""
    return {
        "text": text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "start_ms": start_ms,
        "end_ms": end_ms,
    }


def save_transcript_chunks(chunks: list[dict], filename: Optional[str] = None) -> Path:
    """Persist a list of TranscriptChunk dicts to data/transcripts/ as JSON."""
    if filename is None:
        filename = f"transcript_{uuid.uuid4().hex[:8]}.json"
    filepath = DATA_TRANSCRIPTS_DIR / filename
    filepath.write_text(json.dumps(chunks, indent=2, ensure_ascii=False), encoding="utf-8")
    return filepath


# ---------------------------------------------------------------------------
# File / URL based transcription
# ---------------------------------------------------------------------------


def transcribe_audio(
    audio_source: str,
    language_code: Optional[str] = None,
) -> list[dict]:
    """
    Transcribe an audio file or URL.

    Args:
        audio_source: Local file path or public URL of the audio.
        language_code: Optional BCP-47 language code (e.g. "en").

    Returns:
        List of TranscriptChunk dicts.
    """
    config = aai.TranscriptionConfig(
        speech_models=["universal-3-pro", "universal-2"],
        language_detection=True,
        language_code=language_code,
    )

    transcriber = aai.Transcriber()
    transcript = transcriber.transcribe(audio_source, config=config)

    if transcript.status == aai.TranscriptStatus.error:
        raise RuntimeError(f"Transcription failed: {transcript.error}")

    chunks: list[dict] = []
    if transcript.words:
        chunks.append(
            _build_transcript_chunk(
                text=transcript.text,
                start_ms=transcript.words[0].start,
                end_ms=transcript.words[-1].end,
            )
        )

    return chunks


# ---------------------------------------------------------------------------
# Summarization (via AssemblyAI built-in summarization)
# ---------------------------------------------------------------------------


def summarize_audio(
    audio_source: str,
    summary_model: str = "informative",
    summary_type: str = "bullets",
) -> str:
    """
    Transcribe and summarize an audio file using AssemblyAI's built-in
    summarization.

    Args:
        audio_source: Local file path or public URL.
        summary_model: "informative", "conversational", or "catchy".
        summary_type: "bullets", "bullets_verbose", "gist", "headline", or "paragraph".

    Returns:
        Summary string.
    """
    config = aai.TranscriptionConfig(
        speech_models=["universal-3-pro", "universal-2"],
        language_detection=True,
        summarization=True,
        summary_model=aai.SummarizationModel(summary_model),
        summary_type=aai.SummarizationType(summary_type),
    )

    transcript = aai.Transcriber().transcribe(audio_source, config=config)

    if transcript.status == aai.TranscriptStatus.error:
        raise RuntimeError(f"Summarization failed: {transcript.error}")

    return transcript.summary


# ---------------------------------------------------------------------------
# High-level pipeline helper (transcribe → save → summarize)
# ---------------------------------------------------------------------------


def transcribe_and_save(
    audio_source: str,
    save_filename: Optional[str] = None,
    summarize: bool = False,
) -> dict:
    """
    End-to-end helper: transcribe audio, persist chunks, optionally summarize.

    Args:
        audio_source: Local file path or URL.
        save_filename: Optional JSON filename for transcript chunks.
        summarize: Whether to also return a summary.

    Returns:
        Dict with keys: chunks, filepath, summary (if requested).
    """
    chunks = transcribe_audio(audio_source)
    filepath = save_transcript_chunks(chunks, save_filename)

    result = {"chunks": chunks, "filepath": str(filepath)}

    if summarize:
        result["summary"] = summarize_audio(audio_source)

    return result


# ---------------------------------------------------------------------------
# CLI entry point (for quick testing)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <audio_file_or_url> [--summarize]")
        sys.exit(1)

    source = sys.argv[1]
    do_summary = "--summarize" in sys.argv

    print(f"Transcribing: {source}")
    result = transcribe_and_save(source, summarize=do_summary)

    print(f"\nSaved {len(result['chunks'])} chunks → {result['filepath']}")
    for chunk in result["chunks"]:
        print(f"  {chunk['text']}")

    if do_summary:
        print(f"\n--- Summary ---\n{result['summary']}")
