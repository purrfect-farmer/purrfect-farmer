import { cn } from "@/lib/utils";
import { Dialog } from "radix-ui";

function BottomDialogContainer(props) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
      <Dialog.Content
        {...props}
        className={cn(
          "bg-white dark:bg-neutral-800",
          "fixed z-50 inset-x-0 bottom-0 flex flex-col h-5/6 rounded-t-xl",
          "flex flex-col",
          props.className
        )}
      />
    </Dialog.Portal>
  );
}

function BottomDialog({
  title,
  icon,
  description,
  children,
  onCloseButtonClick,
}) {
  return (
    <BottomDialogContainer onOpenAutoFocus={(ev) => ev.preventDefault()}>
      <>
        <div className="flex flex-col min-w-0 min-h-0 gap-2 p-4 overflow-auto grow">
          <div className="flex relative">
            {/* Icon */}
            <img src={icon} className="w-10 mx-auto rounded-full" />
          </div>

          {/* Title */}
          <Dialog.Title className="text-xl font-bold font-turret-road text-orange-500 text-center">
            {title}
          </Dialog.Title>

          {/* Description */}
          <Dialog.Description className="sr-only">
            {description}
          </Dialog.Description>

          {children}
        </div>
        <div className="flex flex-col p-4 font-bold shrink-0">
          <Dialog.Close
            onClick={onCloseButtonClick}
            className="p-2.5 text-white bg-blue-500 rounded-lg"
          >
            Close
          </Dialog.Close>
        </div>
      </>
    </BottomDialogContainer>
  );
}

BottomDialog.Container = BottomDialogContainer;

export default BottomDialog;
