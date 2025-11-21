import LabelToggle from "@/components/LabelToggle";
import { memo } from "react";
import { SettingsGroup } from "./SettingsComponents";

export default memo(function PCOptionsGroup({
  sharedSettings,
  dispatchAndConfigureSharedSettings,
}) {
  if (import.meta.env.VITE_WHISKER) return null;

  return (
    <SettingsGroup id="pc" title="PC Options">
      {/* Open Farmer in new Window */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSharedSettings(
            "openFarmerInNewWindow",
            ev.target.checked
          )
        }
        checked={sharedSettings?.openFarmerInNewWindow}
      >
        Open Farmer in new Window
      </LabelToggle>

      {/* (SHARED) Open Farmer on StartUp */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSharedSettings(
            "openFarmerOnStartup",
            ev.target.checked
          )
        }
        checked={sharedSettings?.openFarmerOnStartup}
      >
        Open Farmer on Startup
      </LabelToggle>

      {/* (SHARED) Close Main Window on Startup */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSharedSettings(
            "closeMainWindowOnStartup",
            ev.target.checked
          )
        }
        checked={sharedSettings?.closeMainWindowOnStartup}
      >
        Close Main Window on Startup
      </LabelToggle>
    </SettingsGroup>
  );
});
