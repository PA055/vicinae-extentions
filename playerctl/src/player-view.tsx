import React from 'react';
import { ActionPanel, Action, List, showToast, Icon, Toast, getPreferenceValues } from '@vicinae/api';
import { exec } from "child_process"

export default function PlayerInfo() {
  return (
    <List searchBarPlaceholder={'Search actions...'}>
      <List.Section title={'Player Info'}>
        {actions.map((action) => (
          <List.Item 
            key={action.title}
            title={action.title}
            icon={action.icon}
            actions={
              <ActionPanel>
                <Action title="Execute" icon={Icon.Cog} onAction={action.action} />
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
  }
]
