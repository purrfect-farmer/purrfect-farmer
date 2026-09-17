import { useQuery } from "@tanstack/react-query";

import useAuto from "./useAuto";
import useCloudQueryOptions from "./useCloudQueryOptions";

/** Index the rows by Telegram user id, so a row looks its own snapshot up */
const indexSnapshots = (rows) => new Map(rows.map((row) => [row.id, row]));

/** What every account the server farms for this drop last looked like, in one query */
export default function useAutoCloudSnapshotsQuery() {
  const { config } = useAuto();
  const { enabled, auth, cloudBackend, cloudServer } = useCloudQueryOptions();

  return useQuery({
    enabled,
    select: indexSnapshots,
    refetchInterval: 30_000,
    queryKey: [config.id, "cloud", "snapshots", enabled, cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend
        .post(`/api/auto/${config.id}/snapshots`, { auth }, { signal })
        .then((res) => res.data),
  });
}

/** One account's row, null when this server does not farm it, alongside the state of the read itself */
export function useAutoCloudSnapshot(userId) {
  const { enabled } = useCloudQueryOptions();
  const { data, isLoading } = useAutoCloudSnapshotsQuery();

  return {
    enabled,
    loading: isLoading,
    row: (userId && data?.get(String(userId))) || null,
  };
}
