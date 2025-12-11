import { cn } from "@/utils";
import { memo } from "react";

export default memo(function Toggle({ className, ...props }) {
  return (
    <>
      <input {...props} type="checkbox" className="sr-only peer" />
      <div
        className={cn(
          "shrink-0",
          "relative rounded-full",
          "inline-flex h-6 w-11 items-center",
          "bg-neutral-200 dark:bg-neutral-600",
          "peer-checked:bg-blue-500",

          // Before
          "peer-checked:before:translate-x-6 before:translate-x-1",
          "before:inline-block before:h-4 before:w-4",
          "before:transform before:transition",
          "before:rounded-full",
          "before:bg-neutral-400 peer-checked:before:bg-white"
        )}
      />
    </>
  );
});
