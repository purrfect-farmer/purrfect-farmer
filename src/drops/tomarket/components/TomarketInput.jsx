import { cn } from "@/lib/utils";

export default function TomarketInput({ ...props }) {
  return (
    <input
      className={cn(
        "px-4 py-2",
        "rounded-lg",
        "outline-0 ring-1 ring-pink-500",
        props.disabled && "opacity-50",
        props.className
      )}
      {...props}
    />
  );
}
