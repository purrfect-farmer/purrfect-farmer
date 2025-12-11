import { cn } from "@/utils";
import { memo } from "react";
import TextareaAutosize from "react-textarea-autosize";

export default memo(function Textarea(props) {
  return (
    <TextareaAutosize
      {...props}
      className={cn(
        "bg-neutral-100 dark:bg-neutral-700",
        "p-2.5 rounded-lg font-bold w-full min-w-0",
        "focus:outline-hidden focus:ring-3 focus:ring-blue-300",
        "disabled:opacity-50",
        props.className
      )}
    />
  );
});
