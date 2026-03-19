import { showToast, Toast, getPreferenceValues } from "@vicinae/api";
import {
  getRecorderStatus,
  startInstantReplay,
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
  const bufferSize = parseInt(prefs["default-replay-buffer-size"]) || 60;
  const captureSource = prefs["default-monitor"]
    ? { type: "monitor" as const, id: prefs["default-monitor"] }
    : { type: "current-monitor" as const };
    
  return {
    captureSource,
    quality: prefs["quality-preset"] || "high",
    audioInput: prefs["audio-input"] || undefined,
    saveLocation: prefs["save-location"] || `${process.env.HOME}/Videos`,
    bufferSize,
  };
}

export default async function StartInstantReplay() {
  const status = await getRecorderStatus();

  if (status !== "idle") {
    if (status === "recording") {
      await showToast({
        style: Toast.Style.Failure,
        title: "Recording is active",
        message: "Stop the recording first",
      });
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "Already in Instant Replay",
        message: "Instant Replay is already active",
      });
    }
    return;
  }

  const options = getDefaultOptions();
  const result = await startInstantReplay(options);

  if (result.success) {
    await showToast({
      style: Toast.Style.Success,
      title: "Instant Replay started",
      message: `${options.bufferSize}s buffer`,
    });
  } else {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to start Instant Replay",
      message: result.error,
    });
  }
}
