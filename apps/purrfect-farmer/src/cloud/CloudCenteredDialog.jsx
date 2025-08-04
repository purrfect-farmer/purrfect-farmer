import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";

export default function CloudCenteredDialog({ title, description, children }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-40",
          "flex items-center justify-center",
          "p-4 overflow-auto bg-black/50"
        )}
      >
        <Dialog.Content
          className={cn(
            "flex flex-col w-full max-w-sm",
            "gap-2 p-4 bg-white dark:bg-neutral-800 rounded-xl"
          )}
        >
          {/* Title */}
          <Dialog.Title
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "font-bold text-center"
            )}
          >
            {title}
          </Dialog.Title>

          {/* Description */}
          <Dialog.Description className="px-2 text-center text-neutral-500 dark:text-neutral-300">
            {description}
          </Dialog.Description>

          {children}

          {/* Cancel Button */}
          <Dialog.Close
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
}
