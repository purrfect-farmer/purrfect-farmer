import ConfirmButton from "@/components/ConfirmButton";
import Input from "@/components/Input";
import LabelToggle from "@/components/LabelToggle";
import ResetButton from "@/components/ResetButton";
import { memo } from "react";
import { SettingsGroup, SettingsLabel } from "./SettingsComponents";

export default memo(function MirrorOptionsGroup({
  sharedSettings,
  mirrorServer,
  setMirrorServer,
  defaultMirrorServer,
  handleSetMirrorServer,
  farmersPerWindow,
  setFarmersPerWindow,
  dispatchAndSetFarmersPerWindow,
  farmerPosition,
  setFarmerPosition,
  handleSetFarmerPosition,
  dispatchAndConfigureSharedSettings,
}) {
  return (
    <SettingsGroup id="mirror" title={"Mirror Options"}>
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSharedSettings("enableMirror", ev.target.checked)
        }
        checked={sharedSettings?.enableMirror}
      >
        Enable Mirror
      </LabelToggle>

      {/* Mirror Server */}
      <SettingsLabel>Mirror Server</SettingsLabel>
      <div className="flex gap-2">
        <Input
          value={mirrorServer}
          onChange={(ev) => setMirrorServer(ev.target.value)}
          placeholder="Mirror Server"
        />

        {/* Reset Button */}
        <ResetButton onClick={() => setMirrorServer(defaultMirrorServer)} />

        {/* Set Button */}
        <ConfirmButton onClick={handleSetMirrorServer} />
      </div>

      {!import.meta.env.VITE_WHISKER ? (
        <>
          {/* (SHARED) Farmers Per Windows */}
          <label className="mt-4 text-neutral-400">
            Farmers Per Window (Min - 3)
          </label>
          <div className="flex gap-2">
            <Input
              value={farmersPerWindow}
              type="number"
              onChange={(ev) => setFarmersPerWindow(ev.target.value)}
              placeholder="Farmers Per Window"
            />

            {/* Set Button */}
            <ConfirmButton
              onClick={() => dispatchAndSetFarmersPerWindow(farmersPerWindow)}
            />
          </div>

          {/* (SHARED) Farmer Postion */}
          <SettingsLabel>Farmer Position</SettingsLabel>
          <div className="flex gap-2">
            <Input
              value={farmerPosition}
              type="number"
              onChange={(ev) => setFarmerPosition(ev.target.value)}
              placeholder="Farmer Position"
            />

            {/* Set Button */}
            <ConfirmButton onClick={handleSetFarmerPosition} />
          </div>
        </>
      ) : null}
    </SettingsGroup>
  );
});
