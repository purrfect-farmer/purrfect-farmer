import LabelToggle from "@/components/LabelToggle";
import { RiRobot2Line } from "react-icons/ri";
import { SettingsGroup } from "./SettingsComponents";
import { memo } from "react";
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
    </SettingsGroup>
  );
});
