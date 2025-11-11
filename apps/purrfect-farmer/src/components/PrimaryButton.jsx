import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function PrimaryButton({
  as: Component = "button",
  ...props
}) {
  return (
    <Component
      {...props}
      className={cn(
        "bg-blue-500 text-white",
        "p-2 rounded-lg font-bold",
        "flex justify-center items-center gap-2",
        "disabled:opacity-50",
        props.className
      )}
    />
  );
});
