import { LuBadgeCheck } from "react-icons/lu";

import { cn } from "@/utils";
import { getWithdrawalTrust } from "@/lib/autoSnapshot";
import { getWithdrawalTrustColor } from "@/constants/farmerStatus";
import { useAutoCloudSnapshot } from "@/hooks/useAutoCloudSnapshotsQuery";

/** The payout record an unverified account has earned, silent until it has one */
export default function AutoTrustedBadge({ account, className }) {
  const { row } = useAutoCloudSnapshot(account.userId);
  const trust = getWithdrawalTrust(row?.snapshot);

  if (!trust?.trusted) return null;

  return (
    <LuBadgeCheck
      title={`${trust.approved} approved withdrawal(s), none ever flagged`}
      className={cn(
        "shrink-0 size-4",
        getWithdrawalTrustColor(trust),
        className,
      )}
    />
  );
}
