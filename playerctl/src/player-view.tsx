import React from 'react';
import { useState, useEffect } from "react";
import { ActionPanel, Action, List, showToast, Icon, Toast, getPreferenceValues } from '@vicinae/api';
import { exec } from "child_process"
import { getPlayerMetadata, PlayerMetadata } from './playerctl-utils';


export default function PlayerInfo() {
  const [playerMetadata, setPlayerMetadata] = useState<PlayerMetadata | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // I hate js/ts what is this
  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function loadMetadata() {
      try {
        const data = await getPlayerMetadata();
        setPlayerMetadata(data);
      } catch (e) {
        console.error("Failed to load player metadata", e);
      } finally {
        setIsLoading(false);
      }
    }

    loadMetadata();
    interval = setInterval(loadMetadata, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      searchBarPlaceholder="Search actions..."
    >
      <List.Section title="Player Info">
        {actions.map((action) => (
          <List.Item
            key={action.title}
            title={action.title}
            icon={action.icon}
            detail={
              playerMetadata && (
                <List.Item.Detail
                  markdown={`![AlbumArt](${playerMetadata.albumArt})`}
                  metadata={
                    <List.Item.Detail.Metadata>
                      <List.Item.Detail.Metadata.Label title='Title' text={playerMetadata.title || "Unknown"}/>
                      <List.Item.Detail.Metadata.Label title='Album' text={playerMetadata.album || "Unknown"}/>
                      <List.Item.Detail.Metadata.Label title='Artist' text={playerMetadata.artist || "Unknown"}/>
                      <List.Item.Detail.Metadata.Label title='Progess' text={`${playerMetadata.position || "Unknown"} / ${playerMetadata.songLength || "Unknown"}`}/>
                    </List.Item.Detail.Metadata>
                  }
                />
              )
            }
            actions={
              <ActionPanel>
                <Action
                  title="Execute"
                  icon={Icon.Cog}
                  onAction={action.action}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}

type PlayerAction = {
  title: string,
  icon: string,
  action: () => void
}

const selectedPlayers = getPreferenceValues()["playerctl-players"];

const actions: PlayerAction[] = [
  {
    title: "Toggle Play/Pause",
    icon: "media-playback-pause-symbolic",
    action: () => {
      exec(`playerctl --player ${selectedPlayers} play-pause`, (err, stdout) => {
        if (err) {
          showToast(Toast.Style.Failure, "Failed to toggle player's paused state");
        } else {
          showToast(Toast.Style.Success, "Toggled player's paused state");
        }
      });
    }
  },
  {
    title: "Next Song",
    icon: "media-skip-forward-symbolic",
    action: () => {
      exec(`playerctl --player ${selectedPlayers} next`, (err, stdout) => {
        if (err) {
          showToast(Toast.Style.Failure, "Failed to skip to next song");
        } else {
          showToast(Toast.Style.Success, "Skipped to next song");
        }
      });
    }
  },
  {
    title: "Previous Song",
    icon: "media-skip-backward-symbolic",
    action: () => {
      exec(`playerctl --player ${selectedPlayers} previous`, (err, stdout) => {
        if (err) {
          showToast(Toast.Style.Failure, "Failed to skip to previous song");
        } else {
          showToast(Toast.Style.Success, "Skipped to previous song");
        }
      });
    }
  }
]
