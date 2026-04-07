import { cn } from "@/utils";

export default function ATFAutoVersionBadge({ version }) {
  const isV4 = version === 4;
  return (
    <span
      className={cn(
        "text-xs font-mono font-bold",
        isV4
          ? "text-purple-500 dark:text-purple-300"
          : "text-blue-500 dark:text-blue-300",
      )}
    >
      {isV4 ? "V4R2" : "W5"}
    </span>
  );
}
