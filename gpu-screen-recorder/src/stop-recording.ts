import { showToast, clearSearchBar, Toast } from "@vicinae/api";
import { getRecordingState, stopRecording } from "./utils/gsr";

export default async function StopRecording() {
	await clearSearchBar();

	const state = await getRecordingState();

	if (state !== "recording") {
		if (state === "idle") {
			await showToast({
				title: "No active recording",
				style: Toast.Style.Failure,
			});
		} else {
			await showToast({
				title: "Instant Replay is active, not recording",
				style: Toast.Style.Failure,
			});
		}
		return;
	}

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
}
