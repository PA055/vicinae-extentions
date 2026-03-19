import {
	showToast,
	clearSearchBar,
	getPreferenceValues,
	Toast,
} from "@vicinae/api";
import {
	getRecordingState,
	startRecording,
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

export default async function StartRecording() {
	await clearSearchBar();

	const state = await getRecordingState();

	if (state !== "idle") {
		const message =
			state === "recording"
				? "Recording is already active"
				: "Instant Replay is active";
		await showToast({
			title: message,
			style: Toast.Style.Failure,
		});
		return;
	}

	const prefs = getPreferenceValues<Preferences>();
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
}
