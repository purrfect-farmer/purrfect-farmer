import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function PromptDialog({
  title,
  icon,
  description,
  children,
  onCloseButtonClick,
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-40",
          "flex items-center justify-center",
          "p-4 overflow-auto bg-black/50"
        )}
      >
        <Dialog.Content className="flex flex-col w-full max-w-sm gap-2 p-4 bg-white dark:bg-neutral-800 rounded-xl">
          {/* Title */}
          <Dialog.Title
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "font-bold text-center"
            )}
          >
            <img src={icon} className="w-8 h-8 rounded-full" />
            {title}
          </Dialog.Title>

          {/* Description */}
          <Dialog.Description className="px-2 text-center text-neutral-500 dark:text-neutral-300">
            {description}
          </Dialog.Description>

          {children}

          {/* Cancel Button */}
          <Dialog.Close
            onClick={onCloseButtonClick}
            className={cn(
              "px-4 py-2 bg-neutral-200 dark:bg-neutral-900 rounded-lg"
            )}
          >
            Cancel
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
});
