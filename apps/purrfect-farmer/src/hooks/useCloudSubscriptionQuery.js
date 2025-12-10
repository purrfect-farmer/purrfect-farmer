import { useQuery } from "@tanstack/react-query";

import useCloudQueryOptions from "./useCloudQueryOptions";

export default function useCloudSubscriptionQuery(context) {
  const { enabled, auth, cloudBackend, cloudServer } =
    useCloudQueryOptions(context);

  return useQuery({
    enabled,
    retry: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryKey: ["app", "cloud", "subscription", enabled, cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend
        .post(
          "/api/subscription",
          {
            auth,
          },
          { signal }
        )
        .then((res) => res.data),
  });
}
