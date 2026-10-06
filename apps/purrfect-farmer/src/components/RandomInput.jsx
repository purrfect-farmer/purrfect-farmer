import Input from "./Input";
import { LuDices } from "react-icons/lu";
import { cn } from "@/utils";
import { memo } from "react";

export default memo(function RandomInput({ onRandomize, ...props }) {
  return (
    <div className="relative">
      <Input {...props} className={cn("pr-8", props.className)} />

      {/* Randomize button */}
      <button
        tabIndex={-1}
        type="button"
        title="Randomize"
        onClick={onRandomize}
        disabled={props.disabled}
        className={cn(
          "p-2 absolute top-0 right-0 h-full rounded-full",
          "flex items-center justify-center",
          "disabled:opacity-50",
        )}
      >
        <LuDices className="size-4" />
      </button>
    </div>
  );
});
