import { cn } from "@/lib/utils";
import { HiArrowPath } from "react-icons/hi2";

export default function ResetButton(props) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center",
        "px-4 rounded-lg shrink-0",
        "bg-neutral-100",
        props.className
      )}
    >
      <HiArrowPath className="w-4 h-4 " />
    </button>
  );
}
