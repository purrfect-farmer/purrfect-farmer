import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function HrumTaskButton({ icon, title, reward, ...props }) {
  return (
    <button
      {...props}
      className={cn(
        "w-full",
        "flex items-center gap-2 p-2 rounded-lg bg-white text-black",
        "text-left",
        "disabled:opacity-50",
        props.className
      )}
    >
      <img src={icon} className="w-10 h-10 rounded-full shrink-0" />
      <div>
        <h1 className="font-bold">{title}</h1>
        <p className="text-neutral-400">
          +{Intl.NumberFormat().format(reward)} $HRUM
        </p>
      </div>
    </button>
  );
});
