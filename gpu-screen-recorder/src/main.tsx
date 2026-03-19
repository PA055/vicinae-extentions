import { useState, useEffect, useCallback } from "react";
import {
  ActionPanel,
  Action,
  Form,
  showToast,
  Toast,
  getPreferenceValues,
  Icon,
  Color,
} from "@vicinae/api";
import {
  type RecorderMode,
  type CaptureSource,
  type QualityPreset,
  type RecorderOptions,
  getRecorderStatus,
  startRecording,
  stopRecording,
  startInstantReplay,
  saveInstantReplay,
} from "./recorder";

type Mode = "recording" | "instant-replay";

interface Preferences {
  "default-monitor": string;
  "default-replay-buffer-size": string;
  "quality-preset": QualityPreset;
  "audio-input": string;
  "save-location": string;
}

function StatusDisplay({ mode }: { mode: RecorderMode }) {
  const statusText: Record<RecorderMode, string> = {
    idle: "Idle",
    recording: "Recording",
    "instant-replay": "Instant Replay",
  };

  return (
    <Form.Description
      title="Status"
      text={statusText[mode]}
    />
  );
}

export default function MainView() {
  const preferences = getPreferenceValues<Preferences>();

  const [mode, setMode] = useState<Mode>("recording");
  const [status, setStatus] = useState<RecorderMode>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [captureSourceType, setCaptureSourceType] = useState<"current-monitor" | "monitor" | "window">("current-monitor");
  const [monitorId, setMonitorId] = useState("");
  const [quality, setQuality] = useState<QualityPreset>(preferences["quality-preset"] || "high");
  const [audioInput, setAudioInput] = useState(preferences["audio-input"] || "");
  const [saveLocation, setSaveLocation] = useState(
    preferences["save-location"] || `${process.env.HOME}/Videos`
  );
  const [bufferSize, setBufferSize] = useState(
    parseInt(preferences["default-replay-buffer-size"]) || 60
  );

  const fetchStatus = useCallback(async () => {
    const currentStatus = await getRecorderStatus();
    setStatus(currentStatus);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const getCaptureSource = (): CaptureSource => {
    if (captureSourceType === "current-monitor") {
      return { type: "current-monitor" };
    } else if (captureSourceType === "monitor") {
      return { type: "monitor", id: monitorId || preferences["default-monitor"] };
    } else {
      return { type: "window" };
    }
  };

  const handleStart = async () => {
    setIsProcessing(true);
    try {
      if (status !== "idle") {
        await showToast({
          style: Toast.Style.Failure,
          title: "Recorder is active",
          message: "Stop the current recording first",
        });
        setIsProcessing(false);
        return;
      }

      const options: RecorderOptions = {
        captureSource: getCaptureSource(),
        quality,
        audioInput: audioInput || undefined,
        saveLocation,
        bufferSize: mode === "instant-replay" ? bufferSize : undefined,
      };

      let result: { success: boolean; error?: string };
      if (mode === "recording") {
        result = await startRecording(options);
      } else {
        result = await startInstantReplay(options);
      }

      if (result.success) {
        await showToast({
          style: Toast.Style.Success,
          title: `${mode === "recording" ? "Recording" : "Instant Replay"} started`,
          message: mode === "instant-replay" ? `${bufferSize}s buffer` : undefined,
        });
        await fetchStatus();
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to start",
          message: result.error,
        });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: String(error),
      });
    }
    setIsProcessing(false);
  };

  const handleStop = async () => {
    setIsProcessing(true);
    try {
      const result = await stopRecording();
      if (result.success) {
        await showToast({
          style: Toast.Style.Success,
          title: "Stopped",
          message: status === "recording" ? "Recording saved" : "Instant Replay stopped",
        });
        await fetchStatus();
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to stop",
          message: result.error,
        });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: String(error),
      });
    }
    setIsProcessing(false);
  };

  const handleSaveReplay = async () => {
    setIsProcessing(true);
    try {
      const result = await saveInstantReplay();
      if (result.success) {
        await showToast({
          style: Toast.Style.Success,
          title: "Saved",
          message: "Last replay saved",
        });
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to save",
          message: result.error,
        });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: String(error),
      });
    }
    setIsProcessing(false);
  };

  const getPrimaryActionTitle = () => {
    if (status !== "idle") {
      return "Stop";
    }
    return mode === "recording" ? "Start Recording" : "Start Instant Replay";
  };

  const handlePrimaryAction = () => {
    if (status !== "idle") {
      handleStop();
    } else {
      handleStart();
    }
  };

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action
            title={getPrimaryActionTitle()}
            onAction={handlePrimaryAction}
            icon={status !== "idle" ? Icon.Stop : Icon.CircleFilled}
          />
          {status === "instant-replay" && (
            <Action
              title="Save Instant Replay"
              onAction={handleSaveReplay}
              icon={Icon.Download}
              shortcut={{ modifiers: ["cmd"], key: "s" }}
            />
          )}
        </ActionPanel>
      }
    >
      <Form.Description title="" text="GPU Screen Recorder Control Panel" />

      <StatusDisplay mode={status} />

      <Form.Separator />

      <Form.Dropdown
        id="mode"
        title="Mode"
        value={mode}
        onChange={(value) => setMode(value as Mode)}
      >
        <Form.Dropdown.Item value="recording" title="Recording" />
        <Form.Dropdown.Item value="instant-replay" title="Instant Replay" />
      </Form.Dropdown>

      {mode === "instant-replay" && (
        <Form.TextField
          id="buffer-size"
          title="Buffer (sec)"
          placeholder="60"
          value={String(bufferSize)}
          onChange={(value) => setBufferSize(parseInt(value) || 60)}
        />
      )}

      <Form.Dropdown
        id="capture-source"
        title="Capture"
        value={captureSourceType}
        onChange={(value) => setCaptureSourceType(value as "current-monitor" | "monitor" | "window")}
      >
        <Form.Dropdown.Item value="current-monitor" title="Current Monitor" />
        <Form.Dropdown.Item value="monitor" title="Select Monitor" />
        <Form.Dropdown.Item value="window" title="Window (Wayland)" />
      </Form.Dropdown>

      {captureSourceType === "monitor" && (
        <Form.TextField
          id="monitor-id"
          title="Monitor ID"
          placeholder={preferences["default-monitor"] || "DP-1"}
          value={monitorId}
          onChange={setMonitorId}
        />
      )}

      <Form.Dropdown
        id="quality"
        title="Quality"
        value={quality}
        onChange={(value) => setQuality(value as QualityPreset)}
      >
        <Form.Dropdown.Item value="medium" title="Medium" />
        <Form.Dropdown.Item value="high" title="High" />
        <Form.Dropdown.Item value="very_high" title="Very High" />
        <Form.Dropdown.Item value="ultra" title="Ultra" />
      </Form.Dropdown>

      <Form.TextField
        id="audio-input"
        title="Audio"
        placeholder="default_output (optional)"
        value={audioInput}
        onChange={setAudioInput}
      />

      <Form.TextField
        id="save-location"
        title="Save to"
        placeholder="~/Videos"
        value={saveLocation}
        onChange={setSaveLocation}
      />
    </Form>
  );
}
