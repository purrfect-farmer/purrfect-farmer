import { cn } from "@/lib/utils";
import { memo } from "react";

import Toggle from "./Toggle";

export default memo(function LabelToggle({ children, ...props }) {
  return (
    <label
      className={cn(
        "bg-neutral-100 dark:bg-neutral-700",
        "flex items-center gap-4 p-2 cursor-pointer rounded-xl",
        props.disabled && "opacity-50"
      )}
    >
      <h4 className="min-w-0 min-h-0 grow">{children}</h4> <Toggle {...props} />
    </label>
  );
});
