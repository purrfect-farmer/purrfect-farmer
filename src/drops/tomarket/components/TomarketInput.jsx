import { cn } from "@/lib/utils";

export default function TomarketInput({ ...props }) {
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
}
