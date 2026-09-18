import { LuCoins, LuPickaxe } from "react-icons/lu";

import { cn } from "@/utils";
import { formatDistanceToNow } from "date-fns";
import { formatFigure, hasValue, isWithdrawable } from "@/lib/autoSnapshot";
import useAuto from "@/hooks/useAuto";
import { useAutoCloudSnapshot } from "@/hooks/useAutoCloudSnapshotsQuery";

/** What the drop last said about an account, from the snapshot the server has stored */
export default function AutoAccountSnapshot({ account, ...props }) {
  const { config } = useAuto();
  const { enabled, loading, row } = useAutoCloudSnapshot(account.userId);

  /** An account this server does not farm reads as it did before */
  if (!enabled || (!loading && !row?.snapshot)) return null;

  const snapshot = row?.snapshot;
  const minimum = snapshot?.minWithdrawal || config.minWithdrawal;
  const withdrawable = snapshot && isWithdrawable(snapshot, minimum);
  const holding = snapshot && hasValue(snapshot.holding);

  return (
    <span
      {...props}
      title={
        snapshot?.updatedAt
          ? `Farmed ${formatDistanceToNow(snapshot.updatedAt, { addSuffix: true })}`
          : "Waiting for the server"
      }
      className={cn(
        "flex flex-wrap items-center gap-x-2 text-xs",
        "text-neutral-400 dark:text-neutral-300",
        props.className,
      )}
    >
      {/* Holding the drop reports for the linked wallet, tinted once there is one */}
      <span
        className={cn(
          "inline-flex items-center gap-0.5",
          holding ? "text-orange-500 dark:text-orange-400" : null,
        )}
      >
        <LuPickaxe className="size-2.5" />
        {snapshot ? formatFigure(snapshot.holding) : "-.--"}
      </span>

      {/* Mined pool, tinted once it can be withdrawn and left quiet until then */}
      <span
        className={cn(
          "inline-flex items-center gap-0.5",
          withdrawable ? "text-emerald-500" : null,
        )}
      >
        <LuCoins className="size-2.5" />
        {snapshot ? formatFigure(snapshot.balance) : "-.--"}
      </span>
    </span>
  );
}
