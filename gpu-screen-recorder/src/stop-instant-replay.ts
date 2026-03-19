import { showToast, clearSearchBar, Toast } from "@vicinae/api";
import { getRecordingState, stopReplay } from "./utils/gsr";

export default async function StopInstantReplay() {
	await clearSearchBar();

	const state = await getRecordingState();

	if (state !== "instant_replay") {
		if (state === "idle") {
			await showToast({
				title: "No active instant replay",
				style: Toast.Style.Failure,
			});
		} else {
			await showToast({
				title: "Recording is active, not instant replay",
				style: Toast.Style.Failure,
			});
		}
		return;
	}

	const result = await stopReplay();

	if (result.success) {
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
}
