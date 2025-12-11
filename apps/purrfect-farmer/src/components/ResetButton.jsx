import { cn } from "@/utils";
import { memo } from "react";
import { HiArrowPath } from "react-icons/hi2";

export default memo(function ResetButton(props) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center",
        "px-4 rounded-lg shrink-0",
        "bg-neutral-100 dark:bg-neutral-700",
        "disabled:opacity-50",
        props.className
      )}
    >
      <HiArrowPath className="w-4 h-4 " />
    </button>
  );
});
