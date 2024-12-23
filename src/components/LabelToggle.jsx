import { cn } from "@/lib/utils";
import Toggle from "./Toggle";
import { memo } from "react";

export default memo(function LabelToggle({ children, ...props }) {
  return (
    <label
      className={cn(
        "bg-neutral-100 dark:bg-neutral-700",
        "flex items-center gap-4 p-2 cursor-pointer rounded-xl"
      )}
    >
      <h4 className="min-w-0 min-h-0 grow">{children}</h4> <Toggle {...props} />
    </label>
  );
});
