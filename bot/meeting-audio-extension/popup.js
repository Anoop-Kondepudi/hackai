const EXTENSION_RUNTIME_VERSION = "1.1.0";
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const transcripts = document.getElementById("transcripts");
const status = document.getElementById("status");

let isStreaming = false;

initialize();

async function initialize() {
  stopBtn.disabled = true;
  status.textContent = "Ready to start";
  console.log(`[Live Transcriber ${EXTENSION_RUNTIME_VERSION}] popup initialized`);

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "TRANSCRIPT" && message.text) {
      const prefix = message.isFinal ? "" : "… ";
      transcripts.textContent += `${prefix}${message.text}\n`;
      transcripts.scrollTop = transcripts.scrollHeight;
      return;
    }

    if (message.action === "STATUS") {
      status.textContent = message.status;
      const currentlyRecording = typeof message.status === "string" && message.status.startsWith("Recording");
      isStreaming = currentlyRecording;
      startBtn.disabled = currentlyRecording;
      stopBtn.disabled = !currentlyRecording;
      return;
    }

    if (message.action === "ERROR") {
      const rawMessage = message.message || "Unknown error";
      if (rawMessage.includes("tabCapture.capture is not a function")) {
        status.textContent = "Error: Extension runtime is stale. Please reload extension in chrome://extensions and try again.";
      } else {
        status.textContent = `Error: ${rawMessage}`;
      }
      isStreaming = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  });

  try {
    const state = await sendMessage({ action: "GET_STATE" });
    if (state?.ok && state.isStreaming) {
      isStreaming = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      status.textContent = `Recording tab ${state.tabId ?? ""}`.trim();
    }
  } catch (error) {
    status.textContent = `Error: ${error.message}`;
  }

  startBtn.addEventListener("click", async () => {
    if (isStreaming) return;

    startBtn.disabled = true;
    status.textContent = "Starting...";

    try {
      const tabId = await getActiveTabId();
      const response = await sendMessage({ action: "START", tabId });
      if (!response?.ok) {
        throw new Error(response?.message || "Failed to start streaming");
      }
    } catch (error) {
      status.textContent = `Error: ${error.message}`;
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  });

  stopBtn.addEventListener("click", async () => {
    if (!isStreaming) return;

    await sendMessage({ action: "STOP" });
    isStreaming = false;
    status.textContent = "Stopped";
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
}

function getActiveTabId() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(tabs?.[0]?.id);
    });
  });
}

function sendMessage(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}
