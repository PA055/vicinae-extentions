import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

export type RecordingState = "idle" | "recording" | "instant_replay";

export type CaptureSource =
	| { type: "current_monitor" }
	| { type: "monitor"; name: string }
	| { type: "window" }
	| { type: "focused" };

export type QualityPreset = "medium" | "high" | "very_high" | "ultra";

export interface RecordingOptions {
	captureSource: CaptureSource;
	quality: QualityPreset;
	audioInput?: string;
	saveLocation: string;
	fps?: number;
	containerFormat?: string;
}

export interface ReplayOptions extends RecordingOptions {
	bufferSize: number;
}

const GSR_COMMAND = "gpu-screen-recorder";

export async function isGpuScreenRecorderInstalled(): Promise<boolean> {
	try {
		execSync(`which ${GSR_COMMAND}`, { encoding: "utf-8" });
		return true;
	} catch {
		return false;
	}
}

export async function getAvailableMonitors(): Promise<string[]> {
	try {
		const output = execSync(`${GSR_COMMAND} --list-monitors`, {
			encoding: "utf-8",
		});
		return output
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0);
	} catch {
		return [];
	}
}

export async function getAvailableAudioDevices(): Promise<string[]> {
	try {
		const output = execSync(`${GSR_COMMAND} --list-audio-devices`, {
			encoding: "utf-8",
		});
		return output
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0);
	} catch {
		return [];
	}
}

export async function getCurrentMonitor(): Promise<string | null> {
	try {
		const monitors = await getAvailableMonitors();
		if (monitors.length > 0) {
			return monitors[0];
		}
		return null;
	} catch {
		return null;
	}
}

function buildCaptureArg(source: CaptureSource): string {
	switch (source.type) {
		case "current_monitor":
			return "screen";
		case "monitor":
			return source.name;
		case "window":
			return "portal";
		case "focused":
			return "focused";
		default:
			return "screen";
	}
}

function buildAudioArg(audioInput?: string): string[] {
	if (!audioInput || audioInput.trim() === "") {
		return [];
	}
	return ["-a", audioInput];
}

function generateOutputPath(
	saveLocation: string,
	_isReplay: boolean,
	containerFormat?: string,
): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const ext = containerFormat || "mkv";
	const baseName = `recording-${timestamp}.${ext}`;
	return `${saveLocation}/${baseName}`;
}

export async function startRecording(
	options: RecordingOptions,
): Promise<{ success: boolean; error?: string; pid?: number }> {
	return new Promise((resolve) => {
		try {
			const captureArg = buildCaptureArg(options.captureSource);
			const audioArgs = buildAudioArg(options.audioInput);
			const outputPath = generateOutputPath(
				options.saveLocation,
				false,
				options.containerFormat,
			);

			const args = [
				"-w",
				captureArg,
				"-o",
				outputPath,
				"-q",
				options.quality,
				...audioArgs,
			];

			if (options.fps) {
				args.push("-f", options.fps.toString());
			}

			if (options.containerFormat) {
				args.push("-c", options.containerFormat);
			}

			const child = spawn(GSR_COMMAND, args, {
				stdio: "inherit",
				detached: true,
			});

			console.log(`Recording started: ${outputPath}`);

			resolve({ success: true, pid: child.pid });
		} catch (error) {
			resolve({
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	});
}

export async function startReplay(
	options: ReplayOptions,
): Promise<{ success: boolean; error?: string; pid?: number }> {
	return new Promise((resolve) => {
		try {
			const captureArg = buildCaptureArg(options.captureSource);
			const audioArgs = buildAudioArg(options.audioInput);
			const outputDir = options.saveLocation;

			const args = [
				"-w",
				captureArg,
				"-o",
				outputDir,
				"-q",
				options.quality,
				"-r",
				options.bufferSize.toString(),
				"-ro",
				"-bm",
				"cbr",
				...audioArgs,
			];

			if (options.containerFormat) {
				args.push("-c", options.containerFormat);
			}

			const child = spawn(GSR_COMMAND, args, {
				stdio: "inherit",
				detached: true,
			});

			resolve({ success: true, pid: child.pid });
		} catch (error) {
			resolve({
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	});
}

export async function stopRecording(): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		execSync(`pkill -SIGINT -f ${GSR_COMMAND}`, { encoding: "utf-8" });
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to stop recording",
		};
	}
}

export async function saveReplay(): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		execSync(`pkill -SIGUSR1 -f ${GSR_COMMAND}`, { encoding: "utf-8" });
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to save replay",
		};
	}
}

export async function stopReplay(): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		execSync(`pkill -SIGINT -f ${GSR_COMMAND}`, { encoding: "utf-8" });
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to stop replay",
		};
	}
}

export async function getRecordingState(): Promise<RecordingState> {
	try {
		const output = execSync(
			"ps aux | grep gpu-screen-recorder | grep -v grep",
			{ encoding: "utf-8" },
		);
		if (output.includes("-r ")) {
			return "instant_replay";
		}
		return "recording";
	} catch {
		return "idle";
	}
}

export function validateSaveLocation(savePath: string): boolean {
	if (!savePath || savePath.trim() === "") {
		return false;
	}
	try {
		const expandedPath = path.expandTilde(savePath);
		const stats = fs.statSync(expandedPath);
		return stats.isDirectory();
	} catch {
		return false;
	}
}
