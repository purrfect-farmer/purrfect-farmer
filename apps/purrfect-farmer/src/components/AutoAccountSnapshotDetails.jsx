import { formatDate, formatDistanceToNow } from "date-fns";

import AutoAccountFarmerControls from "./AutoAccountFarmerControls";
import AutoDropVerifiedBadge from "./AutoDropVerifiedBadge";
import {
  FARMER_STATUS_TEXT_COLORS,
  getMiningFreezeColor,
  getProtectionColor,
  getWithdrawalTrustColor,
} from "@/constants/farmerStatus";
import FarmerStatusDot from "./FarmerStatusDot";
import { formatDurationParts } from "@purrfect/shared/utils/core.js";
import InfoRow from "./InfoRow";
import {
  formatFigure,
  formatWithdrawalRecord,
  getMiningFreeze,
  getProtection,
  getWithdrawals,
  getWithdrawalTrust,
  hasValue,
  isWithdrawable,
} from "@/lib/autoSnapshot";
import useAuto from "@/hooks/useAuto";
import { useAutoCloudSnapshot } from "@/hooks/useAutoCloudSnapshotsQuery";

const GOOD = "text-lime-500 dark:text-lime-300";
const BAD = "text-red-500 dark:text-red-400";
const MUTED = "text-neutral-500 dark:text-neutral-400";

/** A stored timestamp, named by its weekday, with how long ago it was */
const formatMoment = (value) =>
  `${formatDate(value, "EEE, PPp")} (${formatDistanceToNow(value, { addSuffix: true })})`;

/** A note, for everything the drop has not reported */
const Note = ({ children }) => (
  <p className={`p-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 ${MUTED}`}>
    {children}
  </p>
);

/** One withdrawal, rendered from whatever fields the drop carries */
const WithdrawalRecord = ({ label, record, valueClassName, note }) => (
  <InfoRow
    label={label}
    valueClassName={valueClassName}
    value={
      <span className="flex flex-col gap-0.5">
        {formatWithdrawalRecord(record).map(([field, value]) => (
          <span key={field}>
            <span className={MUTED}>{field}: </span>
            {value}
          </span>
        ))}
        {note ? <span className={`font-normal ${MUTED}`}>{note}</span> : null}
      </span>
    }
  />
);

/** What the account's settled payouts say about it, once the drop has counted them */
const TrustRow = ({ snapshot }) => {
  const trust = getWithdrawalTrust(snapshot);

  if (!trust) {
    return (
      <InfoRow
        label="Withdrawal record"
        value="Not counted yet - the drop will count it on the next farm"
        valueClassName={MUTED}
      />
    );
  }

  return (
    <InfoRow
      label="Withdrawal record"
      value={
        trust.trusted
          ? `Trusted - ${trust.approved} approved, none ever flagged`
          : `${trust.approved} approved`
      }
      valueClassName={getWithdrawalTrustColor(trust)}
    />
  );
};

/** The account's own withdrawal queue */
const Withdrawals = ({ snapshot }) => {
  const { known, checkedAt, pending, flagged } = getWithdrawals(snapshot);

  if (!known) {
    return (
      <Note>
        The drop has not reported this account&apos;s withdrawals yet. It will
        on the next farm.
      </Note>
    );
  }

  if (!pending.length && !flagged.length) {
    return (
      <>
        <InfoRow
          label="Withdrawals"
          value="None in flight"
          valueClassName={GOOD}
        />
        <TrustRow snapshot={snapshot} />
        {checkedAt ? (
          <InfoRow
            label="Withdrawals checked"
            value={formatMoment(checkedAt)}
            valueClassName={MUTED}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      {/* A flagged history is the drop disputing a payout */}
      {flagged.map((record, index) => (
        <WithdrawalRecord
          key={`flagged-${index}`}
          label="Flagged withdrawal"
          record={record}
          valueClassName={BAD}
          note="The drop is disputing this payout. Scheduled runs skip the account while it stands."
        />
      ))}

      {/* A withdrawal still in flight, which blocks placing another */}
      {pending.map((record, index) => (
        <WithdrawalRecord
          key={`pending-${index}`}
          label="Pending withdrawal"
          record={record}
          valueClassName="text-sky-500 dark:text-sky-300"
          note="Awaiting processing, so no further withdrawal is placed."
        />
      ))}

      <TrustRow snapshot={snapshot} />

      {checkedAt ? (
        <InfoRow
          label="Withdrawals checked"
          value={formatMoment(checkedAt)}
          valueClassName={MUTED}
        />
      ) : null}
    </>
  );
};

/** The heading every state of this section shares */
const Section = ({ children }) => (
  <>
    <h4 className="font-bold text-neutral-500 dark:text-neutral-400">
      Server snapshot
    </h4>
    {children}
  </>
);

/** What the drop last said about an account, read from the server's stored snapshot */
export default function AutoAccountSnapshotDetails({ account }) {
  const { config } = useAuto();
  const { enabled, loading, row } = useAutoCloudSnapshot(account.userId);

  if (!enabled) {
    return (
      <Section>
        <Note>Turn the cloud on to see what the server knows.</Note>
      </Section>
    );
  }

  if (loading) {
    return (
      <Section>
        <Note>Loading...</Note>
      </Section>
    );
  }

  if (!row) {
    return (
      <Section>
        <Note>This server does not farm this account for {config.title}.</Note>
      </Section>
    );
  }

  const { snapshot, assist } = row;
  const minimum = snapshot?.minWithdrawal || config.minWithdrawal;
  const withdrawable = snapshot && isWithdrawable(snapshot, minimum);
  const freeze = getMiningFreeze(snapshot);
  const protection = getProtection(snapshot);
  const miningStartedAt = Number(snapshot?.mining?.startedAt) || 0;
  const flags = snapshot?.risk?.flags || [];

  /** An assist that has not been restored leaves the account on someone else's wallet */
  const onOwnWallet =
    !snapshot?.wallet || snapshot.wallet.address === account.address;

  return (
    <Section>
      {/* Farmer status */}
      <InfoRow
        label="Farmer status"
        value={row.status || "unknown"}
        rightContent={<FarmerStatusDot status={row.status} className="mr-2" />}
        valueClassName={FARMER_STATUS_TEXT_COLORS[row.status] ?? MUTED}
      />

      {/* Freeze deadline, absent on an indefinite freeze */}
      {row.frozenUntil ? (
        <InfoRow
          label="Frozen until"
          value={formatMoment(new Date(row.frozenUntil))}
          valueClassName={FARMER_STATUS_TEXT_COLORS.frozen}
        />
      ) : null}

      {/* Errors */}
      {row.errorCount > 0 ? (
        <InfoRow label="Errors" value={row.errorCount} valueClassName={BAD} />
      ) : null}

      {/* What the last boost sent it, which a reuse would send again */}
      {row.lastBoost?.amount ? (
        <InfoRow
          label="Last boosted"
          value={`${row.lastBoost.amount} ${config.token}`}
          valueClassName="text-orange-500 dark:text-orange-400"
        />
      ) : null}

      {/* Start, pause or freeze it, and gate scheduled farming */}
      <AutoAccountFarmerControls account={account} row={row} />

      {!snapshot ? (
        <Note>
          This account has not been farmed yet, so the drop has reported
          nothing.
        </Note>
      ) : (
        <>
          {/* Miner level */}
          <InfoRow label="Miner level" value={snapshot.level ?? "-"} />

          {/* Holding */}
          <InfoRow
            label="Holding"
            value={`${formatFigure(snapshot.holding)} ${config.token}`}
            valueClassName={
              hasValue(snapshot.holding)
                ? "text-orange-500 dark:text-orange-400"
                : MUTED
            }
          />

          {/* Mined pool */}
          <InfoRow
            label={`Pool balance (minimum ${minimum} ${config.token})`}
            value={`${formatFigure(snapshot.balance)} ${config.token} ${withdrawable ? "🟩" : "🟧"}`}
            valueClassName={withdrawable ? GOOD : MUTED}
          />

          {/* The drop's own flag, which is not the one you mark above */}
          <InfoRow
            label="Verified (by the drop)"
            value={snapshot.verified ? "Yes" : "No"}
            valueClassName={
              snapshot.verified ? "text-sky-500 dark:text-sky-300" : MUTED
            }
            rightContent={
              <AutoDropVerifiedBadge account={account} className="mr-2" />
            }
          />

          {/* The drop's buyer protection, absent on drops that do not report it */}
          {protection ? (
            <>
              <InfoRow
                label="Buyer protection"
                value={protection.revoked ? "Revoked" : "Active"}
                valueClassName={getProtectionColor(protection)}
              />

              <InfoRow
                label="DEX buyer"
                value={protection.dexBuyer ? "Yes" : "No"}
                valueClassName={
                  protection.dexBuyer
                    ? "text-lime-500 dark:text-lime-300"
                    : MUTED
                }
              />
            </>
          ) : null}

          {/* Mining, absent on drops that mine off the clock */}
          {freeze ? (
            <InfoRow
              label="Mining"
              value={
                freeze.frozen
                  ? "🧊 Frozen"
                  : freeze.freezesAt
                    ? `❄️ Freezes in ${formatDurationParts(freeze.msUntilFreeze / 1000)} (${formatDate(freeze.freezesAt, "EEE, PPp")})`
                    : "Running"
              }
              valueClassName={getMiningFreezeColor(freeze)}
            />
          ) : null}

          {/* When the round that sets the freeze above started */}
          {miningStartedAt > 0 ? (
            <InfoRow
              label="Mining started"
              value={formatMoment(new Date(miningStartedAt * 1000))}
              valueClassName={MUTED}
            />
          ) : null}

          {/* Linked wallet */}
          {snapshot.wallet ? (
            <InfoRow
              label={
                onOwnWallet ? "Linked wallet" : "Linked wallet (not its own!)"
              }
              value={snapshot.wallet.address}
              link={`https://tonviewer.com/address/${snapshot.wallet.address}`}
              valueClassName={
                onOwnWallet ? "text-blue-500 dark:text-blue-300" : BAD
              }
            />
          ) : null}

          {/* Ban */}
          {snapshot.banned ? (
            <InfoRow
              label="Banned"
              value={snapshot.banReason || "Unknown"}
              valueClassName={BAD}
            />
          ) : null}

          {/* Risk */}
          {flags.length > 0 ? (
            <InfoRow
              label={`Risk (score ${snapshot.risk.score})`}
              value={flags.join(", ")}
              valueClassName={BAD}
            />
          ) : null}

          {/* Its own withdrawals, which the assist rows below are not */}
          <Withdrawals snapshot={snapshot} />
        </>
      )}

      {/* Who this account withdrew for, since only a verified one is asked to */}
      {assist?.last ? (
        <InfoRow
          label="Last helped"
          value={`${assist.last.requesterId} - ${assist.last.amount} ${config.token}, settled ${formatDistanceToNow(assist.last.settledAt, { addSuffix: true })}`}
          valueClassName="text-lime-500 dark:text-lime-300"
        />
      ) : null}

      {/* A withdrawal the drop has not settled yet */}
      {assist?.pending ? (
        <InfoRow
          label="Helping now"
          value={`${assist.pending.requesterId} - ${assist.pending.amount} ${config.token}, placed ${formatDistanceToNow(assist.pending.placedAt, { addSuffix: true })}`}
          valueClassName="text-sky-500 dark:text-sky-300"
        />
      ) : null}

      {/* Freshness, since these figures are only as new as the last pass */}
      {snapshot?.updatedAt ? (
        <InfoRow
          label="Last farmed"
          value={formatMoment(snapshot.updatedAt)}
          valueClassName={MUTED}
        />
      ) : null}
    </Section>
  );
}
