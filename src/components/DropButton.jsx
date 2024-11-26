import { cn } from "@/lib/utils";

export default function DropButton({ drop, ...props }) {
  return (
    <div className="flex flex-col w-1/3 p-1">
      <button
        {...props}
        className={cn(
          "flex flex-col justify-center items-center",
          "gap-2 p-2 rounded-lg",
          "bg-neutral-100 hover:bg-neutral-200",
          props.className
        )}
        title={drop.title}
      >
        <img src={drop.icon} className="w-10 h-10 rounded-full shrink-0" />
        <h3 className={cn("min-w-0 truncate w-full")}>{drop.title}</h3>
      </button>
    </div>
  );
}
