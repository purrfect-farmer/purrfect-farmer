import { useQuery } from "@tanstack/react-query";

import useAuto from "./useAuto";
import useCloudQueryOptions from "./useCloudQueryOptions";

/** Whether this server is cultivating and with what, which is also how a restart that dropped the vault shows up */
export default function useAutoCloudCultivateStatusQuery() {
  const { config } = useAuto();
  const { enabled, auth, cloudBackend, cloudServer } = useCloudQueryOptions();

  return useQuery({
    enabled,
    refetchInterval: 30_000,
    queryKey: [config.id, "cloud", "cultivate-status", enabled, cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend
        .post(`/api/auto/${config.id}/cultivate-status`, { auth }, { signal })
        .then((res) => res.data),
  });
}
