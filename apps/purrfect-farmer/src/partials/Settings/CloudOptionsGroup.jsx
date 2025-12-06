import ConfirmButton from "@/components/ConfirmButton";
import Input from "@/components/Input";
import LabelToggle from "@/components/LabelToggle";
import ResetButton from "@/components/ResetButton";
import { memo } from "react";
import { SettingsGroup, SettingsLabel } from "./SettingsComponents";

export default memo(function CloudOptionsGroup({
  settings,
  cloudServer,
  setCloudServer,
  defaultCloudServer,
  handleSetCloudServer,
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
      <div className="flex gap-2">
        <Input
          value={cloudServer}
          onChange={(ev) => setCloudServer(ev.target.value)}
          placeholder="Cloud Server"
        />

        {/* Reset Button */}
        <ResetButton onClick={() => setCloudServer(defaultCloudServer)} />

        {/* Set Button */}
        <ConfirmButton onClick={handleSetCloudServer} />
      </div>
    </SettingsGroup>
  );
});
