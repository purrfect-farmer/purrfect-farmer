import { Dialog } from "radix-ui";
import { cn } from "@/utils";

/** Tools Container */
function ToolsContainer(props) {
  return (
    <div {...props} className={cn("flex flex-col gap-2", props.className)} />
  );
}

/** Tools header */
function ToolsHeader(props) {
  return (
    <h2
      {...props}
      className={cn("text-neutral-500 dark:text-neutral-400", "font-bold px-4")}
    />
  );
}

/** Tool button */
function ToolButton({ icon: Icon, children, ...props }) {
  return (
    <Dialog.Close
      {...props}
      className={cn(
        "bg-neutral-100 dark:bg-neutral-700",
        "flex items-center gap-2.5 p-2.5 cursor-pointer rounded-xl",
        "text-left",
      )}
    >
      {Icon && <Icon className="size-5 shrink-0" />}
      <ToolButtonTitle>{children}</ToolButtonTitle>
    </Dialog.Close>
  );
}

/** Tool button title */
function ToolButtonTitle(props) {
  return (
    <h3 {...props} className={cn("min-w-0 truncate w-full", "font-bold")} />
  );
}

const BottomDialogTools = Object.assign(
  {},
  {
    Container: ToolsContainer,
    Header: ToolsHeader,
    Button: ToolButton,
    Title: ToolButtonTitle,
  },
);

export default BottomDialogTools;
