import { memo, useMemo } from "react";

import Button from "./Button";
import { CLOUD_WALLET_BADGES } from "./AutoCloudWalletBadge";
import { CLOUD_WALLET_STATUS } from "@/constants/cloudWalletStatus";
import { cn } from "@/utils";
import {
  getAccountCloudWallet,
  getCloudWalletStatus,
  getMasterCloudWallet,
} from "@/lib/autoCloudWallets";
import useAutoCloudWalletsQuery from "@/hooks/useAutoCloudWalletsQuery";

/** The accounts grouped by how their wallet compares with the stored one */
function groupAccountsByStatus(accounts, data) {
  return Map.groupBy(accounts, (account) =>
    getCloudWalletStatus(getAccountCloudWallet(data, account), account),
  );
}

/** What the Cloud server stores for this drop, with a shortcut to choose the rest */
export default memo(function AutoCloudWalletsSummary({
  master,
  accounts,
  disabled,
  selectAccounts,
}) {
  const { data, isLoading, isError } = useAutoCloudWalletsQuery();

  const groups = useMemo(
    () => (data ? groupAccountsByStatus(accounts, data) : null),
    [accounts, data],
  );

  if (isLoading) {
    return <p className="text-neutral-500">Checking Cloud wallets...</p>;
  }

  if (isError || !groups) {
    return <p className="text-red-500">Could not read Cloud wallets.</p>;
  }

  const masterStatus = getCloudWalletStatus(
    getMasterCloudWallet(data, master),
    master,
  );
  const { Icon, title, className } = CLOUD_WALLET_BADGES[masterStatus];
  const pushed = groups.get(CLOUD_WALLET_STATUS.PUSHED)?.length || 0;
  const outdated = groups.get(CLOUD_WALLET_STATUS.OUTDATED) || [];
  const missing = groups.get(CLOUD_WALLET_STATUS.MISSING) || [];
  const notPushed = [...outdated, ...missing];

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-2 rounded-xl",
        "bg-neutral-100 dark:bg-neutral-700",
      )}
    >
      {/* Master */}
      <p className="flex items-center gap-2 min-w-0">
        <Icon className={cn("shrink-0 size-4", className)} />
        <span className="truncate">Master: {title}</span>
      </p>

      {/* Accounts */}
      <p className="text-neutral-500 dark:text-neutral-400">
        {pushed} of {accounts.length} accounts pushed
        {outdated.length > 0 ? ` · ${outdated.length} outdated` : ""}
      </p>

      {notPushed.length > 0 ? (
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() => selectAccounts(notPushed)}
        >
          Select {notPushed.length} not pushed
        </Button>
      ) : null}
    </div>
  );
});
