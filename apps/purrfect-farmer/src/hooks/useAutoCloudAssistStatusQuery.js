import { useQuery } from "@tanstack/react-query";

import useAuto from "./useAuto";
import useCloudQueryOptions from "./useCloudQueryOptions";

/**
 * Whether this server is assisting, and what it was handed to assist with.
 *
 * The vault lives in the server's memory, so this is also how the extension
 * notices that a restart dropped the wallets.
 */
export default function useAutoCloudAssistStatusQuery() {
  const { config } = useAuto();
  const { enabled, auth, cloudBackend, cloudServer } = useCloudQueryOptions();

  return useQuery({
    enabled,
    refetchInterval: 30_000,
    queryKey: [config.id, "cloud", "assist-status", enabled, cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend
        .post(`/api/auto/${config.id}/assist-status`, { auth }, { signal })
        .then((res) => res.data),
  });
}
