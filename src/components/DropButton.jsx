import useAppContext from "@/hooks/useAppContext";
import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function DropButton({ drop, ...props }) {
  const { settings } = useAppContext();
  const showAsGrid = settings.farmersLayout === "grid";

  return (
    <div className={cn("flex flex-col", showAsGrid ? "w-1/3 p-1" : "w-full")}>
      <button
        {...props}
        className={cn(
          "flex items-center",
          "p-2",
          "bg-neutral-100 dark:bg-neutral-700",
          "hover:bg-neutral-200 dark:hover:bg-neutral-600",
          showAsGrid
            ? "gap-2 flex-col justify-center rounded-lg"
            : "gap-1 text-left rounded-xl",
          props.className
        )}
        title={drop.title}
      >
        <img
          src={drop.icon}
          className={cn(
            "rounded-full shrink-0",
            showAsGrid ? "w-10 h-10" : "w-6 h-6"
          )}
        />
        <h3 className={cn("min-w-0 truncate w-full")}>{drop.title}</h3>
      </button>
    </div>
  );
});
