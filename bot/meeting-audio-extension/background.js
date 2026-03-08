const EXTENSION_RUNTIME_VERSION = "1.1.0";
let ws;
let isStreaming = false;
let activeCaptureTabId = null;
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

chrome.runtime.onInstalled.addListener(() => {
  console.log(`Live Transcriber extension installed (v${EXTENSION_RUNTIME_VERSION}).`);
});

console.log(`Live Transcriber background loaded (v${EXTENSION_RUNTIME_VERSION}).`);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "START") {
    startStreaming(message.tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        sendStatusError(error.message || "Failed to start streaming");
        sendResponse({ ok: false, message: error.message || "Failed to start streaming" });
      });
    return true;
  }

  if (message.action === "STOP") {
    stopStreaming();
    sendResponse({ ok: true });
    return true;
  }

  if (message.action === "GET_STATE") {
    sendResponse({
      ok: true,
      isStreaming,
      tabId: activeCaptureTabId
    });
    return true;
  }

  if (message.action === "AUDIO_CHUNK") {
    if (ws && ws.readyState === WebSocket.OPEN && message.chunk) {
      ws.send(message.chunk);
    }
    return false;
  }

  if (message.action === "CAPTURE_ERROR") {
    sendStatusError(message.message || "Capture failed");
    stopStreaming();
    return false;
  }

  return false;
});

async function startStreaming(requestedTabId) {
  if (isStreaming) {
    throw new Error("Already streaming");
  }

  const tabId = Number.isInteger(requestedTabId) ? requestedTabId : await getActiveTabId();
  if (!Number.isInteger(tabId)) {
    throw new Error("Could not identify tab to capture.");
  }

  activeCaptureTabId = tabId;
  sendStatus(`Connecting backend for tab ${tabId}...`);

  ws = new WebSocket("ws://localhost:3001");

  ws.onopen = () => {
    sendStatus(`Backend connected (tab ${tabId})`);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "TRANSCRIPT") {
        chrome.runtime.sendMessage(data);
      } else if (data.type === "ERROR") {
        sendStatusError(data.message || "Backend transcription error");
      }
    } catch (error) {
      console.error("Invalid backend message", error);
    }
  };

  ws.onerror = () => {
    sendStatusError("Could not connect to ws://localhost:3001");
  };

  ws.onclose = () => {
    if (isStreaming) {
      sendStatus("Disconnected");
    }
    isStreaming = false;
    activeCaptureTabId = null;
    void stopCaptureInOffscreen();
  };

  await waitForWebSocketOpen(ws);
  await ensureOffscreenDocument();

  const streamId = await getMediaStreamIdForTab(tabId);
  const captureStartResult = await sendRuntimeMessage({
    action: "START_CAPTURE",
    streamId,
    sampleRate: 16000
  });

  if (!captureStartResult?.ok) {
    throw new Error(captureStartResult?.message || "Failed to start offscreen capture");
  }

  isStreaming = true;
  sendStatus(`Recording tab ${tabId}. You can switch tabs or close popup.`);
}

function stopStreaming() {
  isStreaming = false;
  void stopCaptureInOffscreen();

  if (ws) {
    try {
      ws.close();
    } catch (error) {
      console.error("Failed to close websocket", error);
    }
    ws = null;
  }

  activeCaptureTabId = null;
  sendStatus("Stopped");
}

async function stopCaptureInOffscreen() {
  try {
    await sendRuntimeMessage({ action: "STOP_CAPTURE" });
  } catch {
    // ignore when offscreen isn't up yet
  }
}

async function ensureOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ["USER_MEDIA"],
    justification: "Capture tab audio continuously while popup may be closed"
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

function getMediaStreamIdForTab(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!streamId) {
        reject(new Error("Could not get media stream id for tab"));
        return;
      }

      resolve(streamId);
    });
  });
}

function waitForWebSocketOpen(socket) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Timed out connecting to backend"));
    }, 5000);

    socket.addEventListener(
      "open",
      () => {
        clearTimeout(timeoutId);
        resolve();
      },
      { once: true }
    );

    socket.addEventListener(
      "error",
      () => {
        clearTimeout(timeoutId);
        reject(new Error("Websocket connection failed"));
      },
      { once: true }
    );
  });
}

function sendRuntimeMessage(payload) {
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

function sendStatus(status) {
  chrome.runtime.sendMessage({ action: "STATUS", status });
}

function sendStatusError(message) {
  chrome.runtime.sendMessage({ action: "ERROR", message });
}
