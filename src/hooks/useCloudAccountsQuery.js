import { useQuery } from "@tanstack/react-query";

import useCloudContext from "./useCloudContext";

export default function useCloudAccountsQuery() {
  const { settings, cloudBackend } = useCloudContext();

  return useQuery({
    retry: true,
    refetchInterval: 10000,
    queryKey: ["core", "cloud", "accounts", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/accounts", { signal }).then((res) => res.data),
  });
}
