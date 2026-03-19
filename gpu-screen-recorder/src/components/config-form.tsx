import React, { useState, useEffect } from "react";
import {
	Form,
	ActionPanel,
	Action,
	Icon,
	Toast,
	showToast,
	getPreferenceValues,
} from "@vicinae/api";
import { getAvailableMonitors, getAvailableAudioDevices } from "../utils/gsr";

interface Preferences {
	defaultMonitor: string;
	defaultReplayBufferSize: string;
	qualityPreset: string;
	audioInput: string;
	saveLocation: string;
}

export function ConfigForm() {
	const prefs = getPreferenceValues<Preferences>();
	const [defaultMonitor, setDefaultMonitor] = useState(
		prefs.defaultMonitor || "",
	);
	const [defaultReplayBufferSize, setDefaultReplayBufferSize] = useState(
		prefs.defaultReplayBufferSize || "60",
	);
	const [qualityPreset, setQualityPreset] = useState(
		prefs.qualityPreset || "very_high",
	);
	const [audioInput, setAudioInput] = useState(prefs.audioInput || "");
	const [saveLocation, setSaveLocation] = useState(
		prefs.saveLocation || `${process.env.HOME}/Videos`,
	);
	const [availableMonitors, setAvailableMonitors] = useState<string[]>([]);
	const [availableAudioDevices, setAvailableAudioDevices] = useState<string[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function loadOptions() {
			const monitors = await getAvailableMonitors();
			const audioDevices = await getAvailableAudioDevices();
			setAvailableMonitors(monitors);
			setAvailableAudioDevices(audioDevices);
			setIsLoading(false);
		}
		loadOptions();
	}, []);

	const handleSave = async () => {
		await showToast({
			title: "Settings saved to preferences",
			style: Toast.Style.Success,
		});
	};

	const qualityOptions = [
		{ title: "Medium", value: "medium" },
		{ title: "High", value: "high" },
		{ title: "Very High", value: "very_high" },
		{ title: "Ultra", value: "ultra" },
	];

	const bufferSizeOptions = [
		{ title: "30 seconds", value: "30" },
		{ title: "60 seconds", value: "60" },
		{ title: "120 seconds", value: "120" },
		{ title: "300 seconds (5 min)", value: "300" },
		{ title: "600 seconds (10 min)", value: "600" },
	];

	if (isLoading) {
		return (
			<Form
				isLoading={true}
				actions={
					<ActionPanel>
						<Action title="Back" onAction={() => window.history.back()} />
					</ActionPanel>
				}
			>
				<Form.Description text="Loading..." />
			</Form>
		);
	}

	return (
		<Form
			navigationTitle="Configure"
			actions={
				<ActionPanel>
					<Action.SubmitForm
						title="Save"
						icon={Icon.Checkmark}
						onSubmit={handleSave}
					/>
				</ActionPanel>
			}
		>
			<Form.Description
				title="Capture Settings"
				text="Configure default capture settings for GPU Screen Recorder"
			/>

			<Form.Dropdown
				id="defaultMonitor"
				title="Default Monitor"
				placeholder="Select a monitor"
				value={defaultMonitor}
				onChange={setDefaultMonitor}
			>
				<Form.Dropdown.Item title="Auto-detect" value="" />
				{availableMonitors.map((monitor) => (
					<Form.Dropdown.Item key={monitor} title={monitor} value={monitor} />
				))}
			</Form.Dropdown>

			<Form.Dropdown
				id="qualityPreset"
				title="Quality Preset"
				value={qualityPreset}
				onChange={setQualityPreset}
			>
				{qualityOptions.map((option) => (
					<Form.Dropdown.Item
						key={option.value}
						title={option.title}
						value={option.value}
					/>
				))}
			</Form.Dropdown>

			<Form.Dropdown
				id="defaultReplayBufferSize"
				title="Replay Buffer Size"
				value={defaultReplayBufferSize}
				onChange={setDefaultReplayBufferSize}
			>
				{bufferSizeOptions.map((option) => (
					<Form.Dropdown.Item
						key={option.value}
						title={option.title}
						value={option.value}
					/>
				))}
			</Form.Dropdown>

			<Form.TextField
				id="saveLocation"
				title="Save Location"
				placeholder="~/Videos"
				value={saveLocation}
				onChange={setSaveLocation}
			/>

			<Form.Description text="" />

			<Form.Description
				title="Audio Settings"
				text="Select audio source for recording"
			/>

			<Form.Dropdown
				id="audioInput"
				title="Audio Input"
				placeholder="No audio"
				value={audioInput}
				onChange={setAudioInput}
			>
				<Form.Dropdown.Item title="No audio" value="" />
				<Form.Dropdown.Item title="System audio" value="default_output" />
				<Form.Dropdown.Item title="Microphone" value="default_input" />
				{availableAudioDevices.map((device) => (
					<Form.Dropdown.Item
						key={device}
						title={device}
						value={`device:${device}`}
					/>
				))}
			</Form.Dropdown>
		</Form>
	);
}
