import LabelToggle from "@/components/LabelToggle";
import { memo } from "react";
import {
  SettingsGroup,
  SettingsInput,
  SettingsLabel,
} from "./SettingsComponents";
import { RiRemoteControlLine } from "react-icons/ri";

export default memo(function MirrorOptionsGroup({
  sharedSettings,
  defaultSharedSettings,
  dispatchAndSetFarmersPerWindow,
  dispatchAndConfigureSharedSettings,
  configureFarmerPosition,
}) {
  return (
    <SettingsGroup
      id="mirror"
      title={"Mirror Options"}
      icon={<RiRemoteControlLine className="size-5" />}
    >
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
      <SettingsInput
        placeholder="Mirror Server"
        defaultValue={defaultSharedSettings.mirrorServer}
        initialValue={sharedSettings?.mirrorServer}
        onConfirm={(mirrorServer) =>
          dispatchAndConfigureSharedSettings("mirrorServer", mirrorServer)
        }
      />

      {!import.meta.env.VITE_WHISKER ? (
        <>
          {/* (SHARED) Farmers Per Windows */}
          <label className="mt-4 text-neutral-400">
            Farmers Per Window (Min - 3)
          </label>
          <SettingsInput
            type="number"
            placeholder="Farmers Per Window"
            defaultValue={defaultSharedSettings.farmersPerWindow}
            initialValue={sharedSettings?.farmersPerWindow}
            onConfirm={(farmersPerWindow) =>
              dispatchAndSetFarmersPerWindow(farmersPerWindow)
            }
          />

          {/* (SHARED) Farmer Postion */}
          <SettingsLabel>Farmer Position</SettingsLabel>
          <SettingsInput
            type="number"
            placeholder="Farmer Position"
            defaultValue={defaultSharedSettings.farmerPosition}
            initialValue={sharedSettings?.farmerPosition}
            onConfirm={(farmerPosition) =>
              configureFarmerPosition(farmerPosition)
            }
          />
        </>
      ) : null}
    </SettingsGroup>
  );
});
