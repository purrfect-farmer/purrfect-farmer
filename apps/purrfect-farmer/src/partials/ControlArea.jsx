import AppIcon from "@/assets/images/icon.png?format=webp&w=56&h=56";
import CoreSystemIcon from "@/assets/images/core-system.png?format=webp&w=128";
import UtilsPanel from "@/partials/UtilsPanel";
import useAppContext from "@/hooks/useAppContext";
import { ContextMenu } from "radix-ui";
import { Dialog } from "radix-ui";
import { FaFire, FaPaw } from "react-icons/fa6";
import {
  HiOutlineArrowPath,
  HiOutlineBackward,
  HiOutlineFire,
  HiOutlineForward,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { memo } from "react";

import Mirror from "./Mirror";

export default memo(function ControlArea() {
  const {
    zoomies,
    settings,
    setActiveTab,
    utilsPanelTabs,
    showUtilsPanel,
    dispatchAndSetShowUtilsPanel,
  } = useAppContext();

  return (
    <>
      {/* Zoomies Control */}
      {zoomies.enabled && zoomies.current.drop ? (
        <>
          {/* Controls */}
          <div
            className={cn(
              "flex items-center gap-2 px-2 shrink-0",
              "border-t dark:border-neutral-700"
            )}
          >
            {/* Drop Button */}
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
              {/* Title */}
              <h4 className="font-bold">{zoomies.current.drop.title}</h4>
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
                "bg-linear-to-br",
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
        </>
      ) : null}

      {/* Utils Control */}
      <div className="flex gap-2 px-2 border-t dark:border-neutral-700 shrink-0">
        <ContextMenu.Root>
          <ContextMenu.Trigger asChild>
            <button
              className="flex items-center justify-center w-10 h-10 shrink-0"
              onClick={() => zoomies.dispatchAndToggle(!zoomies.enabled)}
            >
              {zoomies.quickRun ? (
                <FaFire
                  className={cn(
                    "w-7 h-7",
                    zoomies.enabled ? "text-orange-500" : "text-neutral-400"
                  )}
                />
              ) : (
                <FaPaw
                  className={cn(
                    "w-7 h-7",
                    zoomies.enabled ? "text-orange-500" : "text-neutral-400"
                  )}
                />
              )}
            </button>
          </ContextMenu.Trigger>

          <ContextMenu.Portal>
            <ContextMenu.Content
              collisionPadding={5}
              alignOffset={5}
              className={cn(
                "flex flex-col gap-2 p-2",
                "text-white rounded-lg bg-neutral-900",
                "w-[var(--radix-context-menu-content-available-width)]",
                "max-w-48",
                "z-50"
              )}
            >
              <ContextMenu.Item
                onClick={() => zoomies.dispatchAndToggle(true, true)}
                className={cn(
                  "flex items-center gap-2 p-2",
                  "rounded-lg cursor-pointer",
                  "bg-neutral-800 hover:bg-blue-500"
                )}
              >
                <HiOutlineFire className="w-4 h-4" /> Quick Run
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>

        {/* Mirror */}
        {settings.enableMirror ? (
          <Mirror />
        ) : (
          <div className="flex items-center justify-center min-w-0 min-h-0 gap-2 px-2 grow">
            <img className="shrink-0 size-7" src={AppIcon} />{" "}
            {import.meta.env.VITE_APP_NAME}
          </div>
        )}

        {/* Utils */}
        <Dialog.Root
          open={showUtilsPanel}
          onOpenChange={dispatchAndSetShowUtilsPanel}
        >
          {/* Trigger */}
          <Dialog.Trigger
            onClick={() => utilsPanelTabs.reset()}
            className="flex items-center justify-center w-10 h-10 shrink-0"
          >
            <img src={CoreSystemIcon} className="w-7 h-7" />
          </Dialog.Trigger>

          {/* Utils */}
          <UtilsPanel />
        </Dialog.Root>
      </div>
    </>
  );
});
