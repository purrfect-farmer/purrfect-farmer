import useAppContext from "@/hooks/useAppContext";
import { cn } from "@/utils";
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
          "p-2 relative",
          "bg-neutral-100 dark:bg-neutral-700",
          "hover:bg-neutral-200 dark:hover:bg-neutral-600",
          showAsGrid
            ? "gap-2 flex-col justify-center rounded-lg"
            : "gap-1 text-left rounded-xl",
          props.className
        )}
        title={drop.title}
      >
        <span className="relative shrink-0">
          <img
            src={drop.icon}
            className={cn(
              "rounded-full shrink-0",
              showAsGrid ? "w-10 h-10" : "w-6 h-6"
            )}
          />

          {drop.syncToCloud ? (
            <span
              className={cn(
                "absolute inset-0",
                "rotate-45",

                // After
                "after:absolute",
                "after:top-0 after:left-1/2",
                "after:-translate-x-1/2 after:-translate-y-1/2",
                "after:border-2 after:border-white",
                "after:w-2 after:h-2",
                "after:rounded-full",
                "after:bg-green-500"
              )}
            ></span>
          ) : null}
        </span>
        <h3 className={cn("min-w-0 truncate w-full")}>{drop.title}</h3>

        {drop.syncToCloud ? (
          <span className="absolute hidden w-1 h-1 bg-green-500 rounded-full top-2 right-2" />
        ) : null}
      </button>
    </div>
  );
});
