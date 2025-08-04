import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function WontonButton({ color = "primary", ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "px-4 py-2",
        "rounded-lg",
        {
          primary: "bg-green-500 text-black",
          danger: "bg-red-500 text-white",
        }[color],
        props.disabled && "opacity-50",
        props.className
      )}
    />
  );
});
