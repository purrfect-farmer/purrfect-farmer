import CoreSystemIcon from "@/assets/images/core-system.png?format=webp&w=128";
import { useState } from "react";
import { FaPaw } from "react-icons/fa6";

import SyncControl from "./partials/SyncControl";
import UtilsPanel from "./partials/UtilsPanel";
import useAppContext from "./hooks/useAppContext";
import { cn } from "./lib/utils";

export default function ControlArea() {
  const [showUtils, setShowUtils] = useState(false);
  const { zoomies } = useAppContext();

  return (
    <>
      {/* Utils */}
      <UtilsPanel open={showUtils} onOpenChange={setShowUtils} />
      <div className="flex gap-2 bg-white border-t shrink-0">
        <button
          className="flex items-center justify-center w-10 h-10"
          onClick={() => zoomies.dispatchAndToggle(!zoomies.enabled)}
        >
          <FaPaw
            className={cn(
              "w-7 h-7",
              zoomies.enabled ? "text-orange-500" : "text-neutral-400"
            )}
          />
        </button>

        <SyncControl />

        {/* Utils */}
        <button
          className="flex items-center justify-center w-10 h-10"
          onClick={() => setShowUtils(true)}
        >
          <img src={CoreSystemIcon} className="w-7 h-7" />
        </button>
      </div>
    </>
  );
}
