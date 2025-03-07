import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function WontonInput({ ...props }) {
  return (
    <input
      {...props}
      className={cn(
        "px-4 py-2",
        "rounded-lg",
        "dark:bg-neutral-700",
        "border border-wonton-green-500",
        "outline-0 ring-1 ring-transparent focus:ring-wonton-green-500",
        props.disabled && "opacity-50",
        props.className
      )}
    />
  );
});
