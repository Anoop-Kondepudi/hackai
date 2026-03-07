import { WebSocketServer, WebSocket } from "ws";
import { AssemblyAI } from "assemblyai";
import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT || 3001);
const apiKey = process.env.ASSEMBLYAI_API_KEY;

if (!apiKey) {
  console.error("Missing ASSEMBLYAI_API_KEY in environment.");
  process.exit(1);
}

const client = new AssemblyAI({ apiKey });
const wss = new WebSocketServer({ port });

wss.on("connection", async (socket) => {
  console.log("Extension connected.");

  // Use the v3 Streaming API (realtime/v2 returns HTTP 410 for many accounts).
  const transcriber = client.streaming.transcriber({
    sampleRate: 16000,
    speechModel: process.env.ASSEMBLYAI_SPEECH_MODEL || "universal-streaming-multilingual"
  });

  let transcriberReady = false;
  const audioBufferQueue = [];

  transcriber.on("open", ({ id, expires_at: expiresAt }) => {
    transcriberReady = true;
    console.log("AssemblyAI streaming session open:", id, "expires_at:", expiresAt);

    while (audioBufferQueue.length > 0) {
      transcriber.sendAudio(audioBufferQueue.shift());
    }
  });

  transcriber.on("turn", (turn) => {
    const text = (turn.transcript || "").trim();
    if (!text) return;

    const transcriptType = turn.end_of_turn ? "final" : "partial";
    console.log(`Transcript (${transcriptType}):`, text);

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "TRANSCRIPT",
          text,
          isFinal: Boolean(turn.end_of_turn)
        })
      );
    }
  });

  transcriber.on("error", (error) => {
    const message = error?.message || String(error);
    console.error("AssemblyAI streaming error:", message);

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "ERROR",
          message: `AssemblyAI streaming error: ${message}`
        })
      );
    }
  });

  transcriber.on("close", (code, reason) => {
    transcriberReady = false;
    console.log("AssemblyAI streaming closed:", code, reason || "");
  });

  try {
    await transcriber.connect();
  } catch (error) {
    const message = error?.message || String(error);
    console.error("Failed to connect to AssemblyAI streaming API:", message);

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "ERROR",
          message: `Could not connect to AssemblyAI streaming API: ${message}`
        })
      );
      socket.close();
    }
    return;
  }

  socket.on("message", (audioChunk) => {
    const chunk = Buffer.isBuffer(audioChunk) ? audioChunk : Buffer.from(audioChunk);
    if (!chunk.length) return;

    if (transcriberReady) {
      transcriber.sendAudio(chunk);
    } else {
      audioBufferQueue.push(chunk);
    }
  });

  socket.on("close", async () => {
    console.log("Extension disconnected.");
    try {
      await transcriber.close();
    } catch (error) {
      console.error("Error closing AssemblyAI streaming transcriber:", error);
    }
  });

  socket.on("error", (error) => {
    console.error("Extension websocket error:", error);
  });
});

console.log(`Backend websocket server running at ws://localhost:${port}`);
