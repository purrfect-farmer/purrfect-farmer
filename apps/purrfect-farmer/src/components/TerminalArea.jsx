import Container from "./Container";
import { cn } from "@/utils";
import { forwardRef } from "react";

export default forwardRef((props, ref) => (
  <div
    className={cn(
      "grow overflow-auto bg-black text-white flex flex-col-reverse",
    )}
  >
    <div className="grow">
      <Container
        {...props}
        ref={ref}
        className={cn(
          "font-mono whitespace-pre-wrap wrap-break-word p-2",
          props.className,
        )}
      />
    </div>
  </div>
));
