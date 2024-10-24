import { cn } from "@/lib/utils";
import { HiCheck } from "react-icons/hi2";

export default function ConfirmButton(props) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center",
        "px-4 rounded-lg shrink-0",
        "text-white bg-blue-500",
        props.className
      )}
    >
      <HiCheck className="w-4 h-4 " />
    </button>
  );
}
