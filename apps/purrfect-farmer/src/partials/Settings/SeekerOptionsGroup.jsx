import Alert from "@/components/Alert";
import ConfirmButton from "@/components/ConfirmButton";
import Input from "@/components/Input";
import LabelToggle from "@/components/LabelToggle";
import ResetButton from "@/components/ResetButton";
import { cn } from "@/lib/utils";
import { HiOutlineListBullet } from "react-icons/hi2";
import { memo } from "react";
import { SettingsGroup, SettingsLabel } from "./SettingsComponents";

export default memo(function SeekerOptionsGroup({
  settings,
  seekerServer,
  setSeekerServer,
  defaultSeekerServer,
  handleSetSeekerServer,
  dispatchAndConfigureSettings,
  tabs,
}) {
  return (
    <SettingsGroup id={"seeker"} title={"Seeker Options"}>
      <Alert variant={"info"}>
        Enable Seeker to update your Cloud Server Address automatically.
      </Alert>

      {/* Cloud Seeker */}
      <div className="flex gap-2">
        <div className="min-w-0 min-h-0 grow">
          <LabelToggle
            onChange={(ev) =>
              dispatchAndConfigureSettings("enableSeeker", ev.target.checked)
            }
            checked={settings?.enableSeeker}
          >
            <span className="flex flex-col">
              <span>Enable Seeker</span>
            </span>
          </LabelToggle>
        </div>

        {/* Seekers */}
        <button
          onClick={() => tabs.dispatchAndSetValue("seeker")}
          type="button"
          className={cn(
            "shrink-0",
            "inline-flex items-center justify-center",
            "px-4 rounded-lg shrink-0",
            "bg-neutral-100 dark:bg-neutral-700"
          )}
        >
          <HiOutlineListBullet className="w-4 h-4 " />
        </button>
      </div>

      {/* Seeker Server */}
      <SettingsLabel>Seeker Server</SettingsLabel>
      <div className="flex gap-2">
        <Input
          value={seekerServer}
          onChange={(ev) => setSeekerServer(ev.target.value)}
          placeholder="Seeker Server"
        />

        {/* Reset Button */}
        <ResetButton onClick={() => setSeekerServer(defaultSeekerServer)} />

        {/* Set Button */}
        <ConfirmButton onClick={handleSetSeekerServer} />
      </div>
    </SettingsGroup>
  );
});
