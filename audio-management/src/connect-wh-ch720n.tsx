import { closeMainWindow, showToast, Toast } from "@vicinae/api";
import { exec } from "child_process"
import { promisify } from "util";
import { getWPIDFromName } from './getWPIDFromName';

const execPromise = promisify(exec);

export default async function connectToWHCH720N() {
  try {
    await execPromise("bluetoothctl connect 40:72:18:BA:E8:C9");

    const deviceID = await getWPIDFromName("bluez_output.40_72_18_BA_E8_C9.1");
    await execPromise(`wpctl set-default ${deviceID}`);

    showToast(Toast.Style.Success, "Connected to WH-CH720N");
    closeMainWindow();
  } catch (err) {
    showToast(Toast.Style.Failure, "Failed to Connect to WH-CH720N");
    console.log(err);
  }
}
