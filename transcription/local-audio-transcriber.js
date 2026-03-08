import { spawn } from "node:child_process";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY in environment.");
  process.exit(1);
}

const modelId = process.env.ELEVENLABS_MODEL_ID || "scribe_v1";
const languageCode = process.env.ELEVENLABS_LANGUAGE_CODE;
const sampleRate = Number(process.env.AUDIO_SAMPLE_RATE || 16000);
const chunkDurationMs = Number(process.env.TRANSCRIPTION_CHUNK_MS || 5000);
const ffmpegFormat = process.env.AUDIO_INPUT_FORMAT || defaultInputFormat();
const inputDevicePrimary = process.env.AUDIO_INPUT_DEVICE || defaultInputDevice();
const inputDeviceSecondary = process.env.AUDIO_INPUT_DEVICE_2 || defaultSecondaryInputDevice();

let ffmpegProcess;
let pendingAudio = Buffer.alloc(0);
let chunkIndex = 0;
const bytesPerSecond = sampleRate * 2;
const chunkSizeBytes = Math.max(1, Math.floor((bytesPerSecond * chunkDurationMs) / 1000));

let processingQueue = Promise.resolve();

console.log(
  inputDeviceSecondary
    ? `Starting audio capture via ffmpeg: ${inputDevicePrimary} + ${inputDeviceSecondary}`
    : `Starting audio capture via ffmpeg: ${inputDevicePrimary}`
);
console.log(`Using ElevenLabs model: ${modelId}`);
console.log(`Chunk duration: ${chunkDurationMs}ms`);
console.log("Press Ctrl+C to stop.\n");

ffmpegProcess = spawn("ffmpeg", buildFfmpegArgs(), {
  stdio: ["ignore", "pipe", "pipe"]
});

ffmpegProcess.stdout.on("data", (chunk) => {
  pendingAudio = Buffer.concat([pendingAudio, chunk]);
  while (pendingAudio.length >= chunkSizeBytes) {
    const audioSlice = pendingAudio.subarray(0, chunkSizeBytes);
    pendingAudio = pendingAudio.subarray(chunkSizeBytes);
    queueTranscription(audioSlice, false);
  }
});

ffmpegProcess.stderr.on("data", (data) => {
  const msg = data.toString().trim();
  if (msg) console.error("ffmpeg:", msg);
});

ffmpegProcess.on("error", (error) => {
  console.error("Failed to start ffmpeg. Is it installed and on PATH?", error.message);
  shutdown(1);
});

ffmpegProcess.on("close", (code) => {
  console.log(`ffmpeg process exited with code ${code}`);
  shutdown(code === 0 ? 0 : 1);
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

function queueTranscription(audioBuffer, flush) {
  const currentChunk = ++chunkIndex;
  processingQueue = processingQueue.then(() => transcribeChunk(audioBuffer, currentChunk, flush));
}

async function transcribeChunk(audioBuffer, currentChunk, flush) {
  try {
    const wavBuffer = pcm16MonoToWav(audioBuffer, sampleRate);
    const form = new FormData();
    form.append("model_id", modelId);
    if (languageCode) {
      form.append("language_code", languageCode);
    }
    form.append("file", new Blob([wavBuffer], { type: "audio/wav" }), `chunk-${currentChunk}.wav`);

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey
      },
      body: form
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`ElevenLabs transcription failed for chunk ${currentChunk}:`, response.status, errorBody);
      return;
    }

    const payload = await response.json();
    const text = (payload.text || "").trim();
    if (!text) return;

    const tag = flush ? "final" : "partial";
    console.log(`[${tag}][UNKNOWN] ${text}`);
  } catch (error) {
    console.error(`Error transcribing chunk ${currentChunk}:`, error?.message || error);
  }
}

let shuttingDown = false;
async function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (ffmpegProcess && !ffmpegProcess.killed) {
    ffmpegProcess.kill("SIGTERM");
  }

  if (pendingAudio.length > 0) {
    queueTranscription(pendingAudio, true);
    pendingAudio = Buffer.alloc(0);
  }

  try {
    await processingQueue;
  } catch (error) {
    console.error("Error while draining transcription queue:", error?.message || error);
  }

  process.exit(exitCode);
}

function buildFfmpegArgs() {
  const args = ["-hide_banner", "-loglevel", "error"];

  args.push("-f", ffmpegFormat, "-i", inputDevicePrimary);

  if (inputDeviceSecondary) {
    args.push("-f", ffmpegFormat, "-i", inputDeviceSecondary);
    args.push("-filter_complex", "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2");
  }

  args.push("-ac", "1", "-ar", String(sampleRate), "-f", "s16le", "pipe:1");
  return args;
}

function pcm16MonoToWav(pcmData, hz) {
  const header = Buffer.alloc(44);
  const dataSize = pcmData.length;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(hz, 24);
  header.writeUInt32LE(hz * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

function defaultInputFormat() {
  if (process.platform === "darwin") return "avfoundation";
  if (process.platform === "win32") return "dshow";
  return "pulse";
}

function defaultInputDevice() {
  if (process.platform === "darwin") return ":0";
  if (process.platform === "win32") return "audio=CABLE Output (VB-Audio Virtual Cable)";
  return "default";
}

function defaultSecondaryInputDevice() {
  if (process.platform === "win32") return "audio=Microphone (2- Realtek(R) Audio)";
  return "";
}
