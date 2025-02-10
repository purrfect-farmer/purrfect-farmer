import { useQuery } from "@tanstack/react-query";

import useCloudContext from "./useCloudContext";

export default function useCloudAccountsQuery() {
  const { cloudBackend } = useCloudContext();

  return useQuery({
    queryKey: ["core", "cloud", "accounts"],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/accounts", { signal }).then((res) => res.data),
  });
}
