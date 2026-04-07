import { cn } from "@/utils";

export default function Label(props) {
  return (
    <label
      {...props}
      className={cn(
        "font-bold",
        "text-neutral-500 dark:text-neutral-400",
        "flex items-center gap-1",
        props.className,
      )}
    />
  );
}
