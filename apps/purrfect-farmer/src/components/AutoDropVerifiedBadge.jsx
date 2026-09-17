import AutoVerifiedBadge from "./AutoVerifiedBadge";
import { cn } from "@/utils";
import { useAutoCloudSnapshot } from "@/hooks/useAutoCloudSnapshotsQuery";

/** The drop's own verification, which is not the flag the operator marks */
export default function AutoDropVerifiedBadge({ account, className }) {
  const { row } = useAutoCloudSnapshot(account.userId);

  return (
    <AutoVerifiedBadge
      verified={row?.snapshot?.verified}
      title="Verified by the drop"
      className={cn("text-sky-500", className)}
    />
  );
}
