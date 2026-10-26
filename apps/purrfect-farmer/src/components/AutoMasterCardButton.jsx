import { cn } from "@/utils";

/** The colors of each button tone's icon circle */
const TONE_CLASSES = {
  default: "bg-neutral-100 dark:bg-black",
  danger: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

/** A round icon button with a label, for the Auto dashboard's actions */
export function AutoMasterCardButton({
  icon: Icon,
  tone = "default",
  children,
  ...props
}) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex flex-col justify-center items-center gap-1",
        "w-14 shrink-0 text-center text-xs",
        "disabled:opacity-50",
        props.className,
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          "flex justify-center items-center shrink-0",
          "rounded-full size-12",
          TONE_CLASSES[tone],
        )}
      >
        <Icon className="size-6" />
      </span>

      {/* Title */}
      <span className="w-full truncate">{children}</span>
    </button>
  );
}

/** A wrapping row of action buttons, each line centered */
export function AutoMasterCardButtonRow(props) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-wrap justify-center",
        "gap-x-1 gap-y-3",
        props.className,
      )}
    />
  );
}
