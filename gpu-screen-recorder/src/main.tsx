import React, { useState, useEffect } from "react";
import {
	Detail,
	ActionPanel,
	Action,
	Icon,
	Toast,
	showToast,
	getPreferenceValues,
	useNavigation,
} from "@vicinae/api";
import {
	RecordingState,
	getRecordingState,
	startRecording,
	stopRecording,
	startReplay,
	stopReplay,
	saveReplay,
	getCurrentMonitor,
} from "./utils/gsr";
import { ConfigForm } from "./components/config-form";

interface Preferences {
	defaultMonitor: string;
	defaultReplayBufferSize: string;
	qualityPreset: string;
	audioInput: string;
	saveLocation: string;
}

type Mode = "recording" | "instant_replay";

export default function MainView() {
	const prefs = getPreferenceValues<Preferences>();
	const { push } = useNavigation();
	const [state, setState] = useState<RecordingState>("idle");
	const [mode, setMode] = useState<Mode>("recording");
	const [elapsedTime, setElapsedTime] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function init() {
			const currentState = await getRecordingState();
			setState(currentState);
			setIsLoading(false);
		}
		init();
	}, []);

	useEffect(() => {
		if (state !== "idle") {
			const interval = setInterval(() => {
				setElapsedTime((t) => t + 1);
			}, 1000);
			return () => clearInterval(interval);
		} else {
			setElapsedTime(0);
		}
	}, [state]);

	const formatTime = (seconds: number): string => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		if (hrs > 0) {
			return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
				.toString()
				.padStart(2, "0")}`;
		}
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const getStatusEmoji = (): string => {
		switch (state) {
			case "idle":
				return "⚪";
			case "recording":
				return "🔴";
			case "instant_replay":
				return "🟡";
			default:
				return "⚪";
		}
	};

	const getStatusText = (): string => {
		switch (state) {
			case "idle":
				return "Idle";
			case "recording":
				return `Recording • ${formatTime(elapsedTime)}`;
			case "instant_replay":
				return `Instant Replay • Buffer: ${prefs.defaultReplayBufferSize || 60}s`;
			default:
				return "Unknown";
		}
	};

	const getMarkdown = (): string => {
		const bufferSize = prefs.defaultReplayBufferSize || "60";
		const quality = prefs.qualityPreset || "very_high";
		const monitor = prefs.defaultMonitor || "auto-detect";
		const audio = prefs.audioInput || "none";
		const saveDir = prefs.saveLocation || "~/Videos";

		let statusSection = `## ${getStatusEmoji()} ${getStatusText()}`;

		if (state !== "idle") {
			statusSection += `\n\n**Mode:** ${mode === "recording" ? "Recording" : "Instant Replay"}`;
		}

		return `# GPU Screen Recorder

${statusSection}

---

## Current Settings

| Setting | Value |
|---------|-------|
| Monitor | ${monitor} |
| Quality | ${quality} |
| Audio | ${audio} |
| Save Location | ${saveDir} |
| Buffer Size | ${bufferSize}s |
`;
	};

	const handleStartRecording = async () => {
		if (state !== "idle") return;

		const captureSource =
			prefs.defaultMonitor || (await getCurrentMonitor()) || "screen";
		const expandedPath = (
			prefs.saveLocation || `${process.env.HOME}/Videos`
		).replace(/^~/, process.env.HOME || "");

		const result = await startRecording({
			captureSource: { type: "monitor", name: captureSource },
			quality:
				(prefs.qualityPreset as "medium" | "high" | "very_high" | "ultra") ||
				"very_high",
			audioInput: prefs.audioInput || undefined,
			saveLocation: expandedPath,
		});

		if (result.success) {
			setState("recording");
			setMode("recording");
			await showToast({
				title: "Recording started",
				style: Toast.Style.Success,
			});
		} else {
			await showToast({
				title: "Failed to start recording",
				message: result.error,
				style: Toast.Style.Failure,
			});
		}
	};

	const handleStopRecording = async () => {
		if (state !== "recording") return;

		const result = await stopRecording();
		if (result.success) {
			setState("idle");
			await showToast({
				title: "Recording stopped",
				style: Toast.Style.Success,
			});
		} else {
			await showToast({
				title: "Failed to stop recording",
				message: result.error,
				style: Toast.Style.Failure,
			});
		}
	};

	const handleStartReplay = async () => {
		if (state !== "idle") return;

		const captureSource =
			prefs.defaultMonitor || (await getCurrentMonitor()) || "screen";
		const expandedPath = (
			prefs.saveLocation || `${process.env.HOME}/Videos`
		).replace(/^~/, process.env.HOME || "");
		const bufferSize = parseInt(prefs.defaultReplayBufferSize || "60", 10);

		const result = await startReplay({
			captureSource: { type: "monitor", name: captureSource },
			quality:
				(prefs.qualityPreset as "medium" | "high" | "very_high" | "ultra") ||
				"very_high",
			audioInput: prefs.audioInput || undefined,
			saveLocation: expandedPath,
			bufferSize,
		});

		if (result.success) {
			setState("instant_replay");
			setMode("instant_replay");
			await showToast({
				title: `Instant Replay started (${bufferSize}s buffer)`,
				style: Toast.Style.Success,
			});
		} else {
			await showToast({
				title: "Failed to start instant replay",
				message: result.error,
				style: Toast.Style.Failure,
			});
		}
	};

	const handleStopReplay = async () => {
		if (state !== "instant_replay") return;

		const result = await stopReplay();
		if (result.success) {
			setState("idle");
			await showToast({
				title: "Instant Replay stopped",
				style: Toast.Style.Success,
			});
		} else {
			await showToast({
				title: "Failed to stop instant replay",
				message: result.error,
				style: Toast.Style.Failure,
			});
		}
	};

	const handleSaveClip = async () => {
		if (state !== "instant_replay") return;

		const bufferSize = parseInt(prefs.defaultReplayBufferSize || "60", 10);
		const result = await saveReplay();

		if (result.success) {
			await showToast({
				title: `Saved last ${bufferSize} seconds`,
				style: Toast.Style.Success,
			});
		} else {
			await showToast({
				title: "Failed to save clip",
				message: result.error,
				style: Toast.Style.Failure,
			});
		}
	};

	const handleOpenConfig = () => {
		push(<ConfigForm />);
	};

	if (isLoading) {
		return <Detail markdown="# GPU Screen Recorder\n\nLoading..." />;
	}

	return (
		<Detail
			markdown={getMarkdown()}
			actions={
				<ActionPanel>
					{state === "idle" && (
						<>
							<Action
								title="Start Recording"
								icon={Icon.CircleFilled}
								onAction={handleStartRecording}
							/>
							<Action
								title="Start Instant Replay"
								icon={Icon.Clock}
								onAction={handleStartReplay}
							/>
							<Action
								title="Configure"
								icon={Icon.Gear}
								onAction={handleOpenConfig}
							/>
						</>
					)}

					{state === "recording" && (
						<>
							<Action
								title="Stop Recording"
								icon={Icon.Stop}
								onAction={handleStopRecording}
							/>
							<Action
								title="Configure"
								icon={Icon.Gear}
								onAction={handleOpenConfig}
							/>
						</>
					)}

					{state === "instant_replay" && (
						<>
							<Action
								title="Save Clip"
								icon={Icon.Save}
								onAction={handleSaveClip}
							/>
							<Action
								title="Stop Instant Replay"
								icon={Icon.Stop}
								onAction={handleStopReplay}
							/>
							<Action
								title="Configure"
								icon={Icon.Gear}
								onAction={handleOpenConfig}
							/>
						</>
					)}
				</ActionPanel>
			}
		/>
	);
}
