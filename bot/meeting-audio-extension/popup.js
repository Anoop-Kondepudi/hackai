const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const transcripts = document.getElementById("transcripts");
const status = document.getElementById("status");

let ws;
let mediaStream;
let audioContext;
let processor;
let isStreaming = false;

stopBtn.disabled = true;
status.textContent = "Ready to start";

startBtn.addEventListener("click", async () => {
  if (isStreaming) return;

  startBtn.disabled = true;
  status.textContent = "Connecting...";

  try {
    await startStreaming();
  } catch (error) {
    console.error("Failed to start streaming:", error);
    status.textContent = `Error: ${error.message}`;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
});

stopBtn.addEventListener("click", () => {
  if (!isStreaming) return;
  stopStreaming();
});

window.addEventListener("beforeunload", () => {
  if (isStreaming) {
    stopStreaming();
  }
});

async function startStreaming() {
  ws = new WebSocket("ws://localhost:3001");

  ws.onopen = () => {
    status.textContent = "Connected. Capturing audio...";
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "TRANSCRIPT" && data.text) {
        const prefix = data.isFinal ? "" : "… ";
        transcripts.textContent += `${prefix}${data.text}\n`;
        transcripts.scrollTop = transcripts.scrollHeight;
      } else if (data.type === "ERROR") {
        status.textContent = `Error: ${data.message}`;
      }
    } catch (error) {
      console.error("Invalid backend message:", error);
    }
  };

  ws.onerror = (event) => {
    console.error("WebSocket error:", event);
    status.textContent = "Error: Could not connect to ws://localhost:3001";
  };

  ws.onclose = () => {
    if (isStreaming) {
      status.textContent = "Disconnected";
    }
    teardownAudio();
    isStreaming = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  };

  await waitForWebSocketOpen(ws);

  mediaStream = await chrome.tabCapture.capture({ audio: true, video: false });
  if (!mediaStream) {
    throw new Error("Tab audio capture failed. Make sure the current tab is playing audio.");
  }

  audioContext = new AudioContext({ sampleRate: 16000 });
  const source = audioContext.createMediaStreamSource(mediaStream);
  processor = audioContext.createScriptProcessor(4096, 1, 1);

  source.connect(processor);
  processor.connect(audioContext.destination);

  processor.onaudioprocess = (event) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const floatData = event.inputBuffer.getChannelData(0);
    ws.send(floatTo16BitPCM(floatData));
  };

  isStreaming = true;
  status.textContent = "Recording";
  startBtn.disabled = true;
  stopBtn.disabled = false;
}

function stopStreaming() {
  status.textContent = "Stopping...";
  isStreaming = false;

  teardownAudio();

  if (ws) {
    try {
      ws.close();
    } catch (error) {
      console.error("Error closing websocket:", error);
    }
    ws = null;
  }

  status.textContent = "Stopped";
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

function teardownAudio() {
  if (processor) {
    try {
      processor.disconnect();
    } catch (error) {
      console.error("Error disconnecting processor:", error);
    }
    processor = null;
  }

  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
}

function waitForWebSocketOpen(socket) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out while connecting to backend."));
    }, 5000);

    socket.addEventListener("open", () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });

    socket.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error("WebSocket connection failed."));
    }, { once: true });
  });
}

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return buffer;
}
