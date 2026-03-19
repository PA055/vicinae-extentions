import {
	showToast,
	clearSearchBar,
	getPreferenceValues,
	Toast,
} from "@vicinae/api";
import { getRecordingState, saveReplay } from "./utils/gsr";

interface Preferences {
	defaultReplayBufferSize: string;
}

export default async function SaveInstantReplay() {
	await clearSearchBar();

	const state = await getRecordingState();

	if (state !== "instant_replay") {
		await showToast({
			title: "No active instant replay to save",
			style: Toast.Style.Failure,
		});
		return;
	}

	const prefs = getPreferenceValues<Preferences>();
	const bufferSize = parseInt(prefs.defaultReplayBufferSize || "60", 10);

	const result = await saveReplay();

	if (result.success) {
		await showToast({
			title: `Saved last ${bufferSize} seconds`,
			style: Toast.Style.Success,
		});
	} else {
		await showToast({
			title: "Failed to save replay",
			message: result.error,
			style: Toast.Style.Failure,
		});
	}
}
