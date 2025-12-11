import { cn } from "@/utils";
import { Dialog } from "radix-ui";
import Container from "./Container";

function BottomDialogContainer(props) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
      <Dialog.Content
        {...props}
        className={cn(
          "bg-white dark:bg-neutral-800",
          "fixed z-50 inset-x-0 bottom-0 h-5/6 rounded-t-xl",
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
        <div className=" min-w-0 min-h-0 overflow-auto grow">
          <Container className="flex flex-col gap-2 p-4 pb-0">
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
          </Container>
        </div>
        <Container className="flex flex-col p-4 font-bold shrink-0">
          <Dialog.Close
            onClick={onCloseButtonClick}
            className="p-2.5 text-white bg-blue-500 rounded-lg"
          >
            Close
          </Dialog.Close>
        </Container>
      </>
    </BottomDialogContainer>
  );
}

BottomDialog.Container = BottomDialogContainer;

export default BottomDialog;
