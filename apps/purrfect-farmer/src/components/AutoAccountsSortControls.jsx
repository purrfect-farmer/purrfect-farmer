import { LuArrowDownWideNarrow, LuArrowUpNarrowWide } from "react-icons/lu";

import Select from "./Select";
import { SORT_OPTIONS } from "@/hooks/useAutoAccountsSort";
import { cn } from "@/utils";

/** Pick the order accounts are listed in, fed by useAutoAccountsSort */
export default function AutoAccountsSortControls({
  sortKey,
  setSortKey,
  direction,
  toggleDirection,
}) {
  return (
    <div className="flex items-center gap-2">
      <Select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
        {SORT_OPTIONS.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select>

      <button
        type="button"
        onClick={toggleDirection}
        title={direction === "desc" ? "Highest first" : "Lowest first"}
        className={cn(
          "p-2.5 rounded-lg shrink-0",
          "text-neutral-500 dark:text-neutral-400",
          "bg-neutral-100 dark:bg-neutral-700",
          "hover:bg-neutral-200 dark:hover:bg-neutral-600",
          "cursor-pointer transition-colors",
        )}
      >
        {direction === "desc" ? (
          <LuArrowDownWideNarrow className="size-4" />
        ) : (
          <LuArrowUpNarrowWide className="size-4" />
        )}
      </button>
    </div>
  );
}
