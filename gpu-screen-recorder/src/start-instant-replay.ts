import {
	showToast,
	clearSearchBar,
	getPreferenceValues,
	Toast,
} from "@vicinae/api";
import {
	getRecordingState,
	startReplay,
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

export default async function StartInstantReplay() {
	await clearSearchBar();

	const state = await getRecordingState();

	if (state === "recording") {
		await showToast({
			title: "Recording is active",
			style: Toast.Style.Failure,
		});
		return;
	}

	if (state === "instant_replay") {
		await showToast({
			title: "Instant Replay is already active",
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
	const bufferSize = parseInt(prefs.defaultReplayBufferSize || "60", 10);

	const result = await startReplay({
		captureSource: { type: "monitor", name: captureSource },
		quality: prefs.qualityPreset || "very_high",
		audioInput: prefs.audioInput || undefined,
		saveLocation: expandedPath,
		bufferSize,
	});

	if (result.success) {
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
}
