import { cn } from "@/lib/utils";

export default function Input(props) {
  return (
    <input
      {...props}
      className={cn(
        "p-2.5 rounded-lg bg-neutral-100 font-bold grow min-h-0 min-w-0",
        props.className
      )}
    />
  );
}
