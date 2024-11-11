import CoreSystemIcon from "@/assets/images/core-system.png?format=webp&w=128";
import { useState } from "react";
import { FaPaw } from "react-icons/fa6";

import SyncControl from "./partials/SyncControl";
import UtilsPanel from "./partials/UtilsPanel";
import useAppContext from "./hooks/useAppContext";
import { cn } from "./lib/utils";
import { HiOutlineArrowPath, HiOutlineForward } from "react-icons/hi2";

export default function ControlArea() {
  const [showUtils, setShowUtils] = useState(false);
  const { zoomies } = useAppContext();

  return (
    <>
      {/* Utils */}
      <UtilsPanel open={showUtils} onOpenChange={setShowUtils} />

      {/* Zoomies Control */}
      {zoomies.enabled && zoomies.current.drop ? (
        <div className="flex items-center gap-2 p-2 bg-white border-t shrink-0">
          <img
            src={zoomies.current.drop.icon}
            className="w-8 h-8 rounded-full shrink-0"
          />
          <div className="flex flex-col min-w-0 min-h-0 truncate grow">
            <h4 className="font-bold">{zoomies.current.drop.title}</h4>
            <p className="text-neutral-500">
              Running{" "}
              {zoomies.current.drop.tasks.indexOf(zoomies.current.task) + 1} of{" "}
              {zoomies.current.drop.tasks.length}
            </p>
          </div>

          {/* Control Button */}
          <button className="shrink-0" onClick={zoomies.refresh}>
            <HiOutlineArrowPath className="w-6 h-6 text-orange-500" />
          </button>
          <button className="shrink-0" onClick={zoomies.processNextTask}>
            <HiOutlineForward className="w-6 h-6 text-orange-500" />
          </button>
        </div>
      ) : null}

      {/* Utils Control */}
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
