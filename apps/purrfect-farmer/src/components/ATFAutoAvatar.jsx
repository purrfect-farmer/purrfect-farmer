import { cn } from "@/utils";
import { useMemo } from "react";

function getInitials(title) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

export default function ATFAutoAvatar({ account, ...props }) {
  const initials = useMemo(() => getInitials(account.title), [account.title]);
  return (
    <div
      {...props}
      className={cn(
        "size-10 shrink-0 rounded-full",
        "bg-orange-500 text-white",
        "flex items-center justify-center",
        "font-bold text-sm cursor-grab active:cursor-grabbing",
        "touch-none select-none",
        props.className,
      )}
    >
      <span className="font-bold">{initials}</span>
    </div>
  );
}
