import { Dialog } from "radix-ui";
import { cn } from "@/utils";

export default function CenteredDialog({
  title,
  description,
  icon: Icon,
  children,
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-40",
          "flex items-center justify-center",
          "p-4 overflow-auto bg-black/50",
        )}
      >
        <Dialog.Content
          className={cn(
            "my-auto flex flex-col w-full",
            "max-w-sm gap-2 p-4",
            "bg-white dark:bg-neutral-800 rounded-xl",
          )}
        >
          {/* Icon */}
          {Icon ? (
            <Icon className="flex size-10 text-orange-500 mx-auto" />
          ) : null}
          <Dialog.Title className="font-bold text-center text-xl text-orange-500 font-turret-road truncate">
            {title}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            {description}
          </Dialog.Description>

          {children}

          <Dialog.Close
            className={cn(
              "px-4 py-2 font-bold bg-neutral-200 dark:bg-neutral-900 rounded-xl",
            )}
          >
            Cancel
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
}
