import { cn } from "@/utils";
import { getExchange } from "@/lib/autoSnapshot";
import { useAutoCloudSnapshot } from "@/hooks/useAutoCloudSnapshotsQuery";
import { MdPerson } from "react-icons/md";

/** The exchange the drop has linked to this account, silent until it has one */
export default function AutoExchangeBadge({ account, className }) {
  const { row } = useAutoCloudSnapshot(account.userId);
  const exchange = getExchange(row?.snapshot);

  if (!exchange) return null;

  return (
    <MdPerson
      title={
        exchange.uid
          ? `Connected to ${exchange.name} (UID ${exchange.uid})`
          : `Connected to ${exchange.name}`
      }
      className={cn("shrink-0 size-4 text-teal-500", className)}
    />
  );
}
