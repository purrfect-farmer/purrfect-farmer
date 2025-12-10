import Alert from "@/components/Alert";
import LabelToggle from "@/components/LabelToggle";
import { cn } from "@/lib/utils";
import { HiOutlineListBullet } from "react-icons/hi2";
import { memo } from "react";
import {
  SettingsGroup,
  SettingsInput,
  SettingsLabel,
} from "./SettingsComponents";

export default memo(function SeekerOptionsGroup({
  tabs,
  settings,
  defaultSettings,
  dispatchAndConfigureSettings,
}) {
  return (
    <SettingsGroup
      id={"seeker"}
      title={"Seeker Options"}
      icon={<HiOutlineListBullet className="size-5" />}
    >
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
      <SettingsInput
        placeholder="Seeker Server"
        defaultValue={defaultSettings.seekerServer}
        initialValue={settings?.seekerServer}
        onConfirm={(seekerServer) =>
          dispatchAndConfigureSettings("seekerServer", seekerServer)
        }
      />
    </SettingsGroup>
  );
});
