import { showToast, Toast, getPreferenceValues } from "@vicinae/api";
import {
  getRecorderStatus,
  startRecording,
  type RecorderOptions,
  type QualityPreset,
} from "./recorder";

interface Preferences {
  "default-monitor": string;
  "default-replay-buffer-size": string;
  "quality-preset": QualityPreset;
  "audio-input": string;
  "save-location": string;
}

function getDefaultOptions(): RecorderOptions {
  const prefs = getPreferenceValues<Preferences>();
  const captureSource = prefs["default-monitor"]
    ? { type: "monitor" as const, id: prefs["default-monitor"] }
    : { type: "current-monitor" as const };
    
  return {
    captureSource,
    quality: prefs["quality-preset"] || "high",
    audioInput: prefs["audio-input"] || undefined,
    saveLocation: prefs["save-location"] || `${process.env.HOME}/Videos`,
  };
}

export default async function StartRecording() {
  console.log("StartRecording: Checking status...");
  const status = await getRecorderStatus();
  console.log("StartRecording: Status:", status);

  if (status !== "idle") {
    if (status === "recording") {
      await showToast({
        style: Toast.Style.Failure,
        title: "Already recording",
        message: "Stop the current recording first",
      });
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "Instant Replay is active",
        message: "Stop Instant Replay first to start recording",
      });
    }
    return;
  }

  const options = getDefaultOptions();
  console.log("StartRecording: Options:", JSON.stringify(options));
  const result = await startRecording(options);
  console.log("StartRecording: Result:", result);

  if (result.success) {
    await showToast({
      style: Toast.Style.Success,
      title: "Recording started",
    });
  } else {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to start recording",
      message: result.error,
    });
  }
}
