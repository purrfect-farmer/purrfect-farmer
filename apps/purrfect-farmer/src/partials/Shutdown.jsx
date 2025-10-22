import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import useAppContext from "@/hooks/useAppContext";
import { cn } from "@/lib/utils";
import { memo } from "react";
import PromptDialog from "@/components/PromptDialog";

export default memo(function Shutdown() {
  const { dispatchAndShutdown } = useAppContext();

  return (
    <PromptDialog
      title={import.meta.env.VITE_APP_NAME}
      description={"Are you sure you want to close the farmer?"}
      icon={AppIcon}
    >
      {/* Shutdown Button */}
      <button
        onClick={() => dispatchAndShutdown()}
        className={cn("px-4 py-2 bg-red-500 text-white rounded-lg")}
      >
        Shutdown
      </button>
    </PromptDialog>
  );
});
