import {
	showToast,
	clearSearchBar,
	getPreferenceValues,
	Toast,
} from "@vicinae/api";
import {
	getRecordingState,
	startRecording,
	stopRecording,
	getCurrentMonitor,
	QualityPreset,
} from "./utils/gsr";

interface Preferences {
	defaultMonitor: string;
	defaultReplayBufferSize: string;
	qualityPreset: QualityPreset;
	audioInput: string;
	saveLocation: string;
}

export default async function ToggleRecording() {
	await clearSearchBar();

	const prefs = getPreferenceValues<Preferences>();
	const state = await getRecordingState();

	if (state === "idle") {
		const captureSource =
			prefs.defaultMonitor || (await getCurrentMonitor()) || "screen";
		const expandedPath = (
			prefs.saveLocation || `${process.env.HOME}/Videos`
		).replace(/^~/, process.env.HOME || "");

		const result = await startRecording({
			captureSource: { type: "monitor", name: captureSource },
			quality: prefs.qualityPreset || "very_high",
			audioInput: prefs.audioInput || undefined,
			saveLocation: expandedPath,
		});

		if (result.success) {
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
	} else if (state === "recording") {
		const result = await stopRecording();
		if (result.success) {
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
	} else {
		await showToast({
			title: "Instant Replay is active",
			message: "Stop Instant Replay first to start recording",
			style: Toast.Style.Failure,
		});
	}
}
