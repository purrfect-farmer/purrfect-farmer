import { cn } from "@/utils";

export default function ATFAutoStickyContainer(props) {
  return (
    <div
      {...props}
      className={cn(
        "-mx-2 -my-3 sticky top-0",
        "flex flex-col p-2",
        "bg-white dark:bg-neutral-800",
        props.className,
      )}
    />
  );
}
