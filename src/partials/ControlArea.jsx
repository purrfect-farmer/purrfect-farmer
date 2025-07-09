import AppIcon from "@/assets/images/icon.png?format=webp&w=56&h=56";
import CoreSystemIcon from "@/assets/images/core-system.png?format=webp&w=128";
import UtilsPanel from "@/partials/UtilsPanel";
import useAppContext from "@/hooks/useAppContext";
import { Dialog } from "radix-ui";
import { memo } from "react";

import Mirror from "./Mirror";

export default memo(function ControlArea() {
  const {
    settings,
    utilsPanelTabs,
    showUtilsPanel,
    dispatchAndSetShowUtilsPanel,
  } = useAppContext();

  return (
    <>
      {/* Utils Control */}
      <div className="flex gap-2 px-2 pl-12 border-t dark:border-neutral-700 shrink-0">
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
