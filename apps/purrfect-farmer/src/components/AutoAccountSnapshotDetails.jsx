import { formatDate, formatDistanceToNow } from "date-fns";

import AutoDropVerifiedBadge from "./AutoDropVerifiedBadge";
import Decimal from "decimal.js";
import FarmerStatusDot from "./FarmerStatusDot";
import InfoRow from "./InfoRow";
import useAuto from "@/hooks/useAuto";
import { useAutoCloudSnapshot } from "@/hooks/useAutoCloudSnapshotsQuery";

const GOOD = "text-lime-500 dark:text-lime-300";
const BAD = "text-red-500 dark:text-red-400";
const MUTED = "text-neutral-500 dark:text-neutral-400";

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

/** A stored timestamp, with how long ago it was */
const formatMoment = (value) =>
  `${formatDate(value, "PPp")} (${formatDistanceToNow(value, { addSuffix: true })})`;

/** A note, for everything the drop has not reported */
const Note = ({ children }) => (
  <p className={`p-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 ${MUTED}`}>
    {children}
  </p>
);

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
  const mining = snapshot?.mining;
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
        valueClassName={row.status === "active" ? GOOD : MUTED}
      />

      {/* Freeze deadline, absent on an indefinite freeze */}
      {row.frozenUntil ? (
        <InfoRow
          label="Frozen until"
          value={formatMoment(new Date(row.frozenUntil))}
          valueClassName="text-sky-500 dark:text-sky-300"
        />
      ) : null}

      {/* Errors */}
      {row.errorCount > 0 ? (
        <InfoRow label="Errors" value={row.errorCount} valueClassName={BAD} />
      ) : null}

      {/* Scheduled farming */}
      <InfoRow
        label="Scheduled farming"
        value={row.farming ? "Enabled" : "Disabled"}
        valueClassName={row.farming ? GOOD : MUTED}
      />

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
            value={`${format(snapshot.holding)} ${config.token}`}
            valueClassName="text-orange-500 dark:text-orange-400"
          />

          {/* Mined pool */}
          <InfoRow
            label={`Pool balance (minimum ${minimum} ${config.token})`}
            value={`${format(snapshot.balance)} ${config.token} ${withdrawable ? "🟩" : "🟧"}`}
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

          {/* Mining, absent on drops that mine off the clock */}
          {mining ? (
            <InfoRow
              label="Mining"
              value={
                mining.frozen
                  ? "🧊 Frozen"
                  : mining.freezesAt
                    ? `❄️ Freezes ${formatMoment(new Date(mining.freezesAt * 1000))}`
                    : "Running"
              }
              valueClassName={mining.frozen ? "text-sky-500" : MUTED}
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
