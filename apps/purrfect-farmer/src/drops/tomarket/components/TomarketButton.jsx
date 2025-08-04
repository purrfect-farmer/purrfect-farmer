import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function TomarketButton({ color = "primary", ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2",
        "rounded-lg font-bold",
        {
          primary: "bg-lime-500 text-black",
          danger: "bg-white text-red-500",
        }[color],
        props.disabled && "opacity-50",
        props.className
      )}
      {...props}
    />
  );
});
