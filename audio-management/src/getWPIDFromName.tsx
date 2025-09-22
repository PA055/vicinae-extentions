import { useState } from "react";
import { exec } from "child_process"

export function getWPIDFromName(name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec("pw-dump", (err, stdout) => {
      if (err) return reject(err);

      try {
        const objects = JSON.parse(stdout);
        const sinkID = objects
          .filter((obj: any) =>
            obj.info?.props?.["media.class"] === "Audio/Sink" &&
            obj.info?.props?.["node.name"] === name
          )
          .map((s: any) => s.id)[0];

        resolve(sinkID?.toString() ?? "0");
      } catch (e) {
        reject(e);
      }
    });
  });
}
