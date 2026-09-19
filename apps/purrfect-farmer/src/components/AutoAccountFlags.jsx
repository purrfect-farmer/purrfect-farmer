import {
  LuBadgeCheck,
  LuHourglass,
  LuShieldOff,
  LuSnowflake,
  LuTriangleAlert,
} from "react-icons/lu";

import {
  getMiningFreezeColor,
  getProtectionColor,
  getWithdrawalTrustColor,
} from "@/constants/farmerStatus";
import { cn } from "@/utils";
import { formatDate } from "date-fns";
import { formatDurationParts } from "@purrfect/shared/utils/core.js";
import {
  getMiningFreeze,
  getProtection,
  getWithdrawals,
  getWithdrawalTrust,
} from "@/lib/autoSnapshot";
import { useAutoCloudSnapshot } from "@/hooks/useAutoCloudSnapshotsQuery";

/** A small tinted badge, in the same idiom as the version and verified badges */
const Pill = ({ icon: Icon, children, className, title }) => (
  <span
    title={title}
    className={cn(
      "inline-flex items-center gap-0.5",
      "text-xs whitespace-nowrap",
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
        className={getMiningFreezeColor(freeze)}
      >
        Frozen
      </Pill>
    );
  }

  if (!freeze.freezesAt) return null;

  /** A deadline already behind us means the drop has not been read since */
  const deadlinePassed = freeze.msUntilFreeze <= 0;
  const countdown = formatDurationParts(freeze.msUntilFreeze / 1000);

  return (
    <Pill
      icon={LuSnowflake}
      title={`Mining freezes ${formatDate(freeze.freezesAt, "EEE, PPp")}`}
      className={getMiningFreezeColor(freeze)}
    >
      {deadlinePassed ? "Freezing" : countdown}
    </Pill>
  );
};

/** The buyer-protection pill, worst standing first and silent on a healthy account */
const ProtectionPill = ({ protection }) => {
  if (!protection) return null;

  if (protection.revoked) {
    return (
      <Pill
        icon={LuShieldOff}
        title="Buyer protection has been revoked"
        className={getProtectionColor(protection)}
      >
        Unprotected
      </Pill>
    );
  }

  if (protection.dexBuyer) return null;

  return (
    <Pill
      icon={LuShieldOff}
      title="No qualified DEX buy - mining can freeze at random"
      className={getProtectionColor(protection)}
    >
      Non-buyer
    </Pill>
  );
};

/** The payout record an unverified account has earned, silent until it has one */
const TrustedPill = ({ trust }) => {
  if (!trust?.trusted) return null;

  return (
    <Pill
      icon={LuBadgeCheck}
      title={`${trust.approved} approved withdrawal(s), none ever flagged`}
      className={getWithdrawalTrustColor(trust)}
    >
      Trusted
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
  const protection = getProtection(snapshot);
  const trust = getWithdrawalTrust(snapshot);
  const hasFreeze = Boolean(freeze && (freeze.frozen || freeze.freezesAt));
  const hasProtection = Boolean(
    protection && (protection.revoked || !protection.dexBuyer),
  );

  if (
    !hasFreeze &&
    !hasProtection &&
    !trust?.trusted &&
    !pending.length &&
    !flagged.length
  )
    return null;

  return (
    <span
      {...props}
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1",
        props.className,
      )}
    >
      <FreezePill freeze={freeze} />

      <ProtectionPill protection={protection} />

      <TrustedPill trust={trust} />

      {/* A withdrawal in flight, so the account must not place another */}
      {pending.length ? (
        <Pill
          icon={LuHourglass}
          title={`${pending.length} withdrawal(s) awaiting processing`}
          className="text-yellow-500 dark:text-yellow-400"
        >
          P ({pending.length})
        </Pill>
      ) : null}

      {/* The drop disputing a payout, which blocks every later withdrawal */}
      {flagged.length ? (
        <Pill
          icon={LuTriangleAlert}
          title={`${flagged.length} flagged withdrawal(s) in the history`}
          className="text-red-500 dark:text-red-400"
        >
          F ({flagged.length})
        </Pill>
      ) : null}
    </span>
  );
}
