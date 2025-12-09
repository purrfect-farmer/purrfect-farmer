import LabelToggle from "@/components/LabelToggle";
import { memo } from "react";
import {
  SettingsGroup,
  SettingsInput,
  SettingsLabel,
} from "./SettingsComponents";

export default memo(function CloudOptionsGroup({
  settings,
  defaultSettings,
  dispatchAndConfigureSettings,
}) {
  return (
    <SettingsGroup id={"cloud"} title={"Cloud Options"}>
      {/* Cloud */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSettings("enableCloud", ev.target.checked)
        }
        checked={settings?.enableCloud}
      >
        <span className="flex flex-col">
          <span>Enable Cloud</span>
          <span className="text-orange-500">(Access Required)</span>
        </span>
      </LabelToggle>

      {/* Cloud Server */}
      <SettingsLabel>Cloud Server</SettingsLabel>
      <SettingsInput
        placeholder="Cloud Server"
        defaultValue={defaultSettings.cloudServer}
        initialValue={settings?.cloudServer}
        onConfirm={(cloudServer) =>
          dispatchAndConfigureSettings("cloudServer", cloudServer)
        }
      />
    </SettingsGroup>
  );
});
