import Toggle from "@/components/Toggle";
import useAppContext from "@/hooks/useAppContext";
import { memo } from "react";

export default memo(function RemoteControl() {
  const { remote } = useAppContext();

  return (
    <label className="flex items-center justify-center gap-2 p-2 cursor-pointer grow min-w-0 min-h-0">
      Remote{" "}
      <Toggle
        checked={remote.syncing}
        onChange={(ev) => {
          remote.setSyncing(ev.target.checked);
        }}
      />
    </label>
  );
});
