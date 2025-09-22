import { getPreferenceValues } from "@vicinae/api/dist";
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec);

export function getPlayerMetadata() {
  const metadata = execAsync(`playerctl --player ${getPreferenceValues()["playerctl-players"]} metadata`)
}
