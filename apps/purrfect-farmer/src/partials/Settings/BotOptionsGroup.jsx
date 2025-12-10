import LabelToggle from "@/components/LabelToggle";
import { memo } from "react";
import { SettingsGroup } from "./SettingsComponents";
import { RiRobot2Line } from "react-icons/ri";
export default memo(function BotOptionsGroup({
  settings,
  dispatchAndConfigureSettings,
}) {
  return (
    <SettingsGroup
      id={"bot"}
      title={"Bot Options"}
      icon={<RiRobot2Line className="size-5" />}
    >
      {/* Enable In-App Browser */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSettings("enableInAppBrowser", ev.target.checked)
        }
        checked={settings?.enableInAppBrowser}
      >
        Enable In-App Browser
      </LabelToggle>

      {/* Mini-App in New Tab */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSettings("miniAppInNewWindow", ev.target.checked)
        }
        checked={settings?.miniAppInNewWindow}
      >
        Mini-App in New Window
      </LabelToggle>

      {/* Auto-Start Bot */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSettings("autoStartBot", ev.target.checked)
        }
        checked={settings?.autoStartBot}
      >
        Auto-Start Bot <span className="text-orange-500">(Session Mode)</span>
      </LabelToggle>

      {/* Close Other Bots */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSettings("closeOtherBots", ev.target.checked)
        }
        checked={settings?.closeOtherBots}
      >
        Close Other Bots
      </LabelToggle>
    </SettingsGroup>
  );
});
