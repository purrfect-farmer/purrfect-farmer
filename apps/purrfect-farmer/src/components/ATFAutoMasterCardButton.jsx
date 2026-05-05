import { cn } from "@/utils";

export function ATFAutoMasterCardButton({ icon: Icon, children, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "flex flex-col justify-center items-center gap-1",
        "text-center text-xs shrink-0",
        "disabled:opacity-50 w-12 overflow-hidden",
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          "flex justify-center items-center shrink-0",
          "bg-neutral-100 dark:bg-black rounded-full aspect-square size-full",
        )}
      >
        <Icon className="size-6" />
      </span>

      {/* Title */}
      <span className="w-full truncate">{children}</span>
    </button>
  );
}
