import { LuHourglass, LuSnowflake, LuTriangleAlert } from "react-icons/lu";

import { MINING_FREEZE_COLORS } from "@/constants/farmerStatus";
import { cn } from "@/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { getMiningFreeze, getWithdrawals } from "@/lib/autoSnapshot";
import { useAutoCloudSnapshot } from "@/hooks/useAutoCloudSnapshotsQuery";

/** A small tinted badge, in the same idiom as the version and verified badges */
const Pill = ({ icon: Icon, children, className, title }) => (
  <span
    title={title}
    className={cn(
      "inline-flex items-center gap-0.5",
      "px-1.5 py-0.5 rounded-full",
      "bg-neutral-200 dark:bg-neutral-600",
      "text-[10px] font-bold whitespace-nowrap",
      className,
    )}
  >
    <Icon className="size-2.5 shrink-0" />
    {children}
  </span>
);

/** The freeze pill, absent on a drop that mines off the clock */
const FreezePill = ({ freeze }) => {
  if (!freeze) return null;

  if (freeze.frozen) {
    return (
      <Pill
        icon={LuSnowflake}
        title="Mining is frozen"
        className={MINING_FREEZE_COLORS.frozen}
      >
        Frozen
      </Pill>
    );
  }

  if (!freeze.freezesAt) return null;

  /** A deadline already behind us means the drop has not been read since */
  const deadlinePassed = freeze.msUntilFreeze <= 0;
  const freezeDistance = formatDistanceToNowStrict(freeze.freezesAt, {
    addSuffix: true,
  });

  return (
    <Pill
      icon={LuSnowflake}
      title={`Mining freezes ${freezeDistance}`}
      className={
        deadlinePassed || freeze.urgent
          ? MINING_FREEZE_COLORS.urgent
          : MINING_FREEZE_COLORS.distant
      }
    >
      {deadlinePassed ? "Freezing" : `Freezes ${freezeDistance}`}
    </Pill>
  );
};

/** The signals that decide whether an account needs attention */
export default function AutoAccountFlags({ account, ...props }) {
  const { enabled, row } = useAutoCloudSnapshot(account.userId);
  const snapshot = row?.snapshot;

  if (!enabled || !snapshot) return null;

  const freeze = getMiningFreeze(snapshot);
  const { pending, flagged } = getWithdrawals(snapshot);
  const hasFreeze = Boolean(freeze && (freeze.frozen || freeze.freezesAt));

  if (!hasFreeze && !pending.length && !flagged.length) return null;

  return (
    <span
      {...props}
      className={cn("flex flex-wrap items-center gap-1", props.className)}
    >
      <FreezePill freeze={freeze} />

      {/* A withdrawal in flight, so the account must not place another */}
      {pending.length ? (
        <Pill
          icon={LuHourglass}
          title={`${pending.length} withdrawal(s) awaiting processing`}
          className="text-sky-500 dark:text-sky-300"
        >
          Pending{pending.length > 1 ? ` ${pending.length}` : ""}
        </Pill>
      ) : null}

      {/* The drop disputing a payout, which blocks every later withdrawal */}
      {flagged.length ? (
        <Pill
          icon={LuTriangleAlert}
          title={`${flagged.length} flagged withdrawal(s) in the history`}
          className="text-red-500 dark:text-red-400"
        >
          Flagged{flagged.length > 1 ? ` ${flagged.length}` : ""}
        </Pill>
      ) : null}
    </span>
  );
}
