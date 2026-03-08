import { spawn } from "node:child_process";
import { AssemblyAI } from "assemblyai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.ASSEMBLYAI_API_KEY;
if (!apiKey) {
  console.error("Missing ASSEMBLYAI_API_KEY in environment.");
  process.exit(1);
}

const speechModel = process.env.ASSEMBLYAI_SPEECH_MODEL || "u3-rt-pro";
const sampleRate = Number(process.env.AUDIO_SAMPLE_RATE || 16000);
const ffmpegFormat = process.env.AUDIO_INPUT_FORMAT || defaultInputFormat();
const inputDevicePrimary = process.env.AUDIO_INPUT_DEVICE || defaultInputDevice();
const inputDeviceSecondary = process.env.AUDIO_INPUT_DEVICE_2 || defaultSecondaryInputDevice();

const enableSpeakerLabels = (process.env.ASSEMBLYAI_SPEAKER_LABELS || "true").toLowerCase() === "true";
const maxSpeakers = process.env.ASSEMBLYAI_MAX_SPEAKERS ? Number(process.env.ASSEMBLYAI_MAX_SPEAKERS) : undefined;

const client = new AssemblyAI({ apiKey });
const transcriber = client.streaming.transcriber({
  sampleRate,
  speechModel,
  speakerLabels: enableSpeakerLabels,
  ...(Number.isInteger(maxSpeakers) ? { maxSpeakers } : {})
});

let ffmpegProcess;
let ready = false;
const queuedChunks = [];

transcriber.on("open", ({ id }) => {
  ready = true;
  console.log(`AssemblyAI session opened: ${id}`);

  while (queuedChunks.length > 0) {
    transcriber.sendAudio(queuedChunks.shift());
  }
});

transcriber.on("turn", (turn) => {
  const text = (turn.transcript || "").trim();
  if (!text) return;
  const tag = turn.end_of_turn ? "final" : "partial";
  const speaker = turn.speaker_label || "UNKNOWN";
  console.log(`[${tag}][${speaker}] ${text}`);
});

transcriber.on("error", (error) => {
  console.error("AssemblyAI streaming error:", error?.message || error);
});

transcriber.on("close", (code, reason) => {
  ready = false;
  console.log("AssemblyAI streaming closed:", code, reason || "");
});

await transcriber.connect();
console.log("Connected to AssemblyAI streaming API");
console.log(
  inputDeviceSecondary
    ? `Starting audio capture via ffmpeg: ${inputDevicePrimary} + ${inputDeviceSecondary}`
    : `Starting audio capture via ffmpeg: ${inputDevicePrimary}`
);
console.log("Press Ctrl+C to stop.\n");

ffmpegProcess = spawn("ffmpeg", buildFfmpegArgs(), {
  stdio: ["ignore", "pipe", "pipe"]
});

ffmpegProcess.stdout.on("data", (chunk) => {
  if (ready) {
    transcriber.sendAudio(chunk);
  } else {
    queuedChunks.push(chunk);
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

let shuttingDown = false;
async function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (ffmpegProcess && !ffmpegProcess.killed) {
    ffmpegProcess.kill("SIGTERM");
  }

  try {
    await transcriber.close();
  } catch (error) {
    console.error("Error closing transcriber:", error?.message || error);
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
