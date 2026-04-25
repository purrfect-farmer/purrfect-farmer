import { MdVisibility, MdVisibilityOff } from "react-icons/md";

import Input from "./Input";
import { cn } from "@/utils";
import { memo } from "react";
import { useState } from "react";

export default memo(function PasswordInput(props) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        type={shown ? "text" : "password"}
        className={cn("pr-8", props.className)}
      />

      {/* Toggle button */}
      <button
        tabIndex={-1}
        type="button"
        onClick={() => setShown((s) => !s)}
        disabled={props.disabled}
        className={cn(
          "p-2 absolute top-0 right-0 h-full rounded-full",
          "flex items-center justify-center",
          "disabled:opacity-50",
        )}
      >
        {shown ? (
          <MdVisibility className="size-4" />
        ) : (
          <MdVisibilityOff className="size-4" />
        )}
      </button>
    </div>
  );
});
