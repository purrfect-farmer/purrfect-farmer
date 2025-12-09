import { HiCheck } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function ConfirmButton(props) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex gap-2 items-center justify-center",
        "px-4 rounded-lg shrink-0",
        "text-white bg-blue-500",
        "disabled:opacity-50",
        props.className
      )}
    >
      {props.children || <HiCheck className="w-4 h-4 " />}
    </button>
  );
});
