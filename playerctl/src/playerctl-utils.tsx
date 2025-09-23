import { getPreferenceValues } from "@vicinae/api";
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec);

export type PlayerMetadata = {
  player?: string,
  title?: string,
  album?: string,
  artist?: string,
  albumArt?: string,
  songLength?: string,
  position?: string,
  paused?: boolean,
}

export async function getPlayerMetadata() {
  const metadataRaw = await execAsync(`playerctl --player ${getPreferenceValues()["playerctl-players"]} metadata`)
  const metadata = metadataRaw.stdout.split("\n").map((u) => u.split(" ").filter((v) => v.length >= 1));
  var info: PlayerMetadata = {};
  info.player = metadata[0][0];
  for (var line of metadata) {
    if (line[1] === "xesam:title") {
      info.title = line.slice(2).join(" ");
    } else if (line[1] === "xesam:album") {
      info.album = line.slice(2).join(" ");
    } else if (line[1] === "xesam:artist") {
      info.artist = line.slice(2).join(" ");
    } else if (line[1] === "mpris:artUrl") {
      info.albumArt = line.slice(2).join(" ");
    } else if (line[1] === "mpris:length") {
      var us = parseInt(line[2]);
      const mins = Math.floor(us / 60000000);
      us %= 60000000;
      const secs = Math.floor(us / 1000000);
      info.songLength = `${mins}:${String(secs).padStart(2, '0')}`
    }
  }
  const positionRaw = await execAsync(`playerctl --player ${getPreferenceValues()["playerctl-players"]} position`)
  const position = Math.floor(parseFloat(positionRaw.stdout))
  const mins = Math.floor(position / 60);
  const secs = position % 60;
  info.position = `${mins}:${String(secs).padStart(2, '0')}`

  const status = await execAsync(`playerctl --player ${getPreferenceValues()["playerctl-players"]} status`);
  if (status.stdout === "Playing")
    info.paused = false;
  else
    info.paused = true;

  return info;
}
