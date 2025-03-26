import { cn } from "@/lib/utils";

export default function StatusIcon({ icon: Icon, status, ...props }) {
  return (
    <div
      {...props}
      className={cn(
        "p-2 rounded-full shrink-0",
        "bg-neutral-50 dark:bg-neutral-700",
        {
          success: "text-green-500",
          error: "text-red-500",
          pending: "text-orange-500",
        }[status],
        props.className
      )}
    >
      <Icon className="size-5" />
    </div>
  );
}
