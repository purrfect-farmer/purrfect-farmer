import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function Input(props) {
  return (
    <input
      {...props}
      className={cn(
        "bg-neutral-100 dark:bg-neutral-700",
        "p-2.5 rounded-lg font-bold w-full min-w-0",
        "focus:outline-hidden focus:ring-3 focus:ring-blue-300",
        "disabled:opacity-50",
        props.className
      )}
    />
  );
});
