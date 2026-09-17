import { LuCoins, LuPickaxe } from "react-icons/lu";

import Decimal from "decimal.js";
import { cn } from "@/utils";
import { formatDistanceToNow } from "date-fns";
import useAuto from "@/hooks/useAuto";
import { useAutoCloudSnapshot } from "@/hooks/useAutoCloudSnapshotsQuery";

/** A drop figure is a string, and a drop that reports nothing yields a dash */
const format = (value) => {
  try {
    return new Decimal(value || 0).toFixed(2);
  } catch {
    return "-.--";
  }
};

/** Whether the pool has reached the drop's minimum, as the server decides it */
const isWithdrawable = (snapshot, minimum) => {
  if (!minimum) return false;

  try {
    return new Decimal(snapshot.balance || 0).greaterThanOrEqualTo(minimum);
  } catch {
    return false;
  }
};

/** What the drop last said about an account, from the snapshot the server has stored */
export default function AutoAccountSnapshot({ account, ...props }) {
  const { config } = useAuto();
  const { enabled, loading, row } = useAutoCloudSnapshot(account.userId);

  /** An account this server does not farm reads as it did before */
  if (!enabled || (!loading && !row?.snapshot)) return null;

  const snapshot = row?.snapshot;
  const minimum = snapshot?.minWithdrawal || config.minWithdrawal;
  const withdrawable = snapshot && isWithdrawable(snapshot, minimum);

  return (
    <span
      {...props}
      title={
        snapshot?.updatedAt
          ? `Farmed ${formatDistanceToNow(snapshot.updatedAt, { addSuffix: true })}`
          : "Waiting for the server"
      }
      className={cn(
        "flex flex-wrap items-center gap-x-2 font-bold",
        "text-neutral-500 dark:text-neutral-300",
        props.className,
      )}
    >
      {/* Holding the drop reports for the linked wallet */}
      <span className="inline-flex items-center gap-0.5">
        <LuPickaxe className="size-3" />
        {snapshot ? format(snapshot.holding) : "-.--"}
      </span>

      {/* Mined pool, marked once it can be withdrawn */}
      <span
        className={cn(
          "inline-flex items-center gap-0.5",
          withdrawable ? "text-green-500 dark:text-green-400" : null,
        )}
      >
        <LuCoins className="size-3" />
        {snapshot ? format(snapshot.balance) : "-.--"}
        {snapshot ? (withdrawable ? " 🟩" : " 🟧") : null}
      </span>
    </span>
  );
}
