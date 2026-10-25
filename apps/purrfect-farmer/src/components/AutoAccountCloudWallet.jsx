import AutoCloudWalletBadge, {
  CLOUD_WALLET_BADGES,
} from "./AutoCloudWalletBadge";
import InfoRow from "./InfoRow";
import { formatMoment } from "./AutoAccountSnapshotDetails";
import useCloudQueryOptions from "@/hooks/useCloudQueryOptions";
import { useAutoCloudWallet } from "@/hooks/useAutoCloudWalletsQuery";

/** Whether the Cloud server stores the account's current wallet, and when it was last pushed */
export default function AutoAccountCloudWallet({ account }) {
  const { enabled } = useCloudQueryOptions();
  const { row, status } = useAutoCloudWallet(account);

  if (!enabled) return null;

  const badge = status ? CLOUD_WALLET_BADGES[status] : null;

  return (
    <>
      <InfoRow
        label="Cloud wallet"
        value={badge ? badge.title : "Loading..."}
        valueClassName={badge?.className}
        rightContent={<AutoCloudWalletBadge account={account} />}
      />

      {row?.updatedAt ? (
        <InfoRow label="Last pushed" value={formatMoment(row.updatedAt)} />
      ) : null}
    </>
  );
}
