import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function FieldStateError({ fieldState, ...props }) {
  return fieldState.error?.message ? (
    <p {...props} className={cn("text-red-500", props.className)}>
      {fieldState.error?.message}
    </p>
  ) : null;
});
