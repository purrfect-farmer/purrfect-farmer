import { useQuery } from "@tanstack/react-query";

import useCloudContext from "./useCloudContext";

export default function useCloudAccountsQuery() {
  const { cloudBackend } = useCloudContext();

  return useQuery({
    refetchInterval: 10000,
    queryKey: ["core", "cloud", "accounts"],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/accounts", { signal }).then((res) => res.data),
  });
}
