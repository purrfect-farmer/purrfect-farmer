import { cn } from "@/utils";

export default function Label(props) {
  return (
    <label
      {...props}
      className={cn(
        "text-xs font-bold",
        "text-neutral-500 dark:text-neutral-400",
        "flex items-center gap-1",
        props.className,
      )}
    />
  );
}
