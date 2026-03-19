import { showToast, Toast, getPreferenceValues } from "@vicinae/api";
import {
  getRecorderStatus,
  startRecording,
  stopRecording,
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

export default async function ToggleRecording() {
  const status = await getRecorderStatus();

  if (status === "idle") {
    const options = getDefaultOptions();
    const result = await startRecording(options);

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
  } else if (status === "recording") {
    const result = await stopRecording();

    if (result.success) {
      await showToast({
        style: Toast.Style.Success,
        title: "Recording stopped",
        message: "Recording saved",
      });
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to stop recording",
        message: result.error,
      });
    }
  } else {
    await showToast({
      style: Toast.Style.Failure,
      title: "Instant Replay is active",
      message: "Stop Instant Replay first to start recording",
    });
  }
}
