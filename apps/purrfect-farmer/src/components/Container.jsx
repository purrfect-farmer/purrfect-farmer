import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const Container = forwardRef(function Container(props, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn("w-full max-w-lg mx-auto p-4", props.className)}
    />
  );
});

export default Container;
