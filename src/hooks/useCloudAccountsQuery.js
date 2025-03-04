import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudAccountsQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: true,
    refetchInterval: 10000,
    queryKey: ["core", "cloud", "accounts", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/accounts", { signal }).then((res) => res.data),
  });
}
