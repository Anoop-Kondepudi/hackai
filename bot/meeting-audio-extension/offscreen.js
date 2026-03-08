let mediaStream;
let audioContext;
let processor;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "START_CAPTURE") {
    startCapture(message.streamId, message.sampleRate || 16000)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        chrome.runtime.sendMessage({ action: "CAPTURE_ERROR", message: error.message || "Capture failed" });
        sendResponse({ ok: false, message: error.message || "Capture failed" });
      });
    return true;
  }

  if (message.action === "STOP_CAPTURE") {
    stopCapture();
    sendResponse({ ok: true });
    return false;
  }

  return false;
});

async function startCapture(streamId, sampleRate) {
  if (!streamId) {
    throw new Error("Missing stream ID for capture");
  }

  stopCapture();

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId
      }
    },
    video: false
  });

  audioContext = new AudioContext({ sampleRate });
  const source = audioContext.createMediaStreamSource(mediaStream);
  processor = audioContext.createScriptProcessor(4096, 1, 1);

  source.connect(processor);
  processor.connect(audioContext.destination);

  processor.onaudioprocess = (event) => {
    const floatData = event.inputBuffer.getChannelData(0);
    chrome.runtime.sendMessage({ action: "AUDIO_CHUNK", chunk: floatTo16BitPCM(floatData) });
  };
}

function stopCapture() {
  if (processor) {
    try {
      processor.disconnect();
    } catch (error) {
      console.error("Failed to disconnect processor", error);
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

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < float32Array.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return buffer;
}
