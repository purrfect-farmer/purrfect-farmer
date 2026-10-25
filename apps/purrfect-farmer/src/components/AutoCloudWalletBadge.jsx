import { MdCloudDone, MdCloudOff, MdCloudSync } from "react-icons/md";

import { CLOUD_WALLET_STATUS } from "@/constants/cloudWalletStatus";
import { cn } from "@/utils";
import { memo } from "react";
import { useAutoCloudWallet } from "@/hooks/useAutoCloudWalletsQuery";

/** Icon, colour and label for each stored wallet status */
export const CLOUD_WALLET_BADGES = {
  [CLOUD_WALLET_STATUS.PUSHED]: {
    Icon: MdCloudDone,
    title: "Pushed to Cloud",
    className: "text-green-500 dark:text-green-400",
  },
  [CLOUD_WALLET_STATUS.OUTDATED]: {
    Icon: MdCloudSync,
    title: "Cloud copy is outdated",
    className: "text-amber-500 dark:text-amber-400",
  },
  [CLOUD_WALLET_STATUS.MISSING]: {
    Icon: MdCloudOff,
    title: "Not pushed to Cloud",
    className: "text-neutral-400 dark:text-neutral-500",
  },
};

/** Whether the Cloud server stores this account's current wallet */
export default memo(function AutoCloudWalletBadge({ account }) {
  const { status } = useAutoCloudWallet(account);

  if (!status) return null;

  const { Icon, title, className } = CLOUD_WALLET_BADGES[status];

  return <Icon title={title} className={cn("shrink-0 size-4", className)} />;
});
