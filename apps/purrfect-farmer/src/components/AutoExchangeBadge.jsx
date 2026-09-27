import { LuLink } from "react-icons/lu";

import { cn } from "@/utils";
import { getExchange } from "@/lib/autoSnapshot";
import { useAutoCloudSnapshot } from "@/hooks/useAutoCloudSnapshotsQuery";

/** The exchange the drop has linked to this account, silent until it has one */
export default function AutoExchangeBadge({ account, className }) {
  const { row } = useAutoCloudSnapshot(account.userId);
  const exchange = getExchange(row?.snapshot);

  if (!exchange) return null;

  return (
    <LuLink
      title={
        exchange.uid
          ? `Connected to ${exchange.name} (UID ${exchange.uid})`
          : `Connected to ${exchange.name}`
      }
      className={cn("shrink-0 size-4 text-teal-500", className)}
    />
  );
}
