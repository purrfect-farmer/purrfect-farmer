import { cn } from "@/lib/utils";

export default function MatchQuestInput({ ...props }) {
  return (
    <input
      {...props}
      className={cn(
        "px-4 py-2",
        "rounded-lg",
        "bg-neutral-700",
        "border border-orange-500",
        "outline-0 ring-1 ring-transparent focus:ring-orange-500",
        props.disabled && "opacity-50",
        props.className
      )}
    />
  );
}
