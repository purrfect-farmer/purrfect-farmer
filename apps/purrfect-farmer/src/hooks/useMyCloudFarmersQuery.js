import { useQuery } from "@tanstack/react-query";

import useCloudQueryOptions from "./useCloudQueryOptions";

export default function useMyCloudFarmersQuery() {
  const { enabled, auth, cloudBackend, cloudServer } = useCloudQueryOptions();

  return useQuery({
    enabled,
    retry: true,
    refetchInterval: 10000,
    queryKey: ["app", "cloud", "farmers", enabled, cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend
        .post("/api/farmers", { auth }, { signal })
        .then((res) => res.data),
  });
}
