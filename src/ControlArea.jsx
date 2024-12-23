import CoreSystemIcon from "@/assets/images/core-system.png?format=webp&w=128";
import { FaPaw } from "react-icons/fa6";
import {
  HiOutlineArrowPath,
  HiOutlineBackward,
  HiOutlineForward,
} from "react-icons/hi2";
import { memo, useState } from "react";

import SyncControl from "./partials/SyncControl";
import UtilsPanel from "./partials/UtilsPanel";
import useAppContext from "./hooks/useAppContext";
import { cn } from "./lib/utils";

export default memo(function ControlArea() {
  const [showUtils, setShowUtils] = useState(false);
  const { zoomies, setActiveTab } = useAppContext();

  return (
    <>
      {/* Utils */}
      <UtilsPanel open={showUtils} onOpenChange={setShowUtils} />

      {/* Zoomies Control */}
      {zoomies.enabled && zoomies.current.drop ? (
        <div
          className={cn(
            "flex items-center gap-2 px-2 shrink-0",
            "border-t dark:border-neutral-700"
          )}
        >
          <button
            className="relative shrink-0"
            onClick={() => setActiveTab(zoomies.current.drop.id)}
          >
            <img
              src={zoomies.current.drop.icon}
              className="w-8 h-8 rounded-full shrink-0"
            />
          </button>
          <div className="flex flex-col min-w-0 min-h-0 truncate grow">
            <h4 className="font-bold">{zoomies.current.drop.title}</h4>
            <p className="text-neutral-400">
              Running{" "}
              {zoomies.current.drop.tasks.indexOf(zoomies.current.task) + 1} of{" "}
              {zoomies.current.drop.tasks.length}
            </p>
          </div>

          {/* Refresh Button */}
          <button
            className="flex items-center justify-center w-10 h-10 shrink-0"
            onClick={() => zoomies.dispatchAndRefresh()}
          >
            <HiOutlineArrowPath className="w-6 h-6 text-orange-500" />
          </button>

          {/* Backward Button */}
          <button
            className="flex items-center justify-center w-10 h-10 shrink-0"
            onClick={() => zoomies.processPreviousTask()}
          >
            <HiOutlineBackward className="w-6 h-6 text-orange-500" />
          </button>

          {/* Forward Button */}
          <button
            className="flex items-center justify-center w-10 h-10 shrink-0"
            onClick={() => zoomies.processNextTask()}
          >
            <HiOutlineForward className="w-6 h-6 text-orange-500" />
          </button>

          {/* Cycles */}
          <span
            className={cn(
              "shrink-0",
              "bg-gradient-to-br",
              "from-red-500 to-purple-500",
              "text-white font-bold",
              "rounded-full",
              "text-xs",
              "flex items-center justify-center",
              "w-5 h-5"
            )}
          >
            {zoomies.current.cycles > 9 ? "9+" : zoomies.current.cycles}
          </span>
        </div>
      ) : null}

      {/* Utils Control */}
      <div className="flex gap-2 px-2 border-t dark:border-neutral-700 shrink-0">
        <button
          className="flex items-center justify-center w-10 h-10 shrink-0"
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
          className="flex items-center justify-center w-10 h-10 shrink-0"
          onClick={() => setShowUtils(true)}
        >
          <img src={CoreSystemIcon} className="w-7 h-7" />
        </button>
      </div>
    </>
  );
});
