import Toggle from "@/components/Toggle";
import useAppContext from "@/hooks/useAppContext";
import { memo } from "react";

export default memo(function Mirror() {
  const { mirror } = useAppContext();

  return (
    <label className="flex items-center justify-center min-w-0 min-h-0 gap-2 p-2 cursor-pointer grow">
      Mirroring{" "}
      <Toggle
        checked={mirror.mirroring}
        onChange={(ev) => {
          mirror.setMirroring(ev.target.checked);
        }}
      />
    </label>
  );
});
