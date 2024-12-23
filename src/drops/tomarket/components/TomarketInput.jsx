import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function TomarketInput({ ...props }) {
  return (
    <input
      className={cn(
        "px-4 py-2",
        "rounded-lg",
        "bg-rose-700 text-white placeholder:text-rose-100",
        "outline-0 font-bold",
        props.disabled && "opacity-50",
        props.className
      )}
      {...props}
    />
  );
});
