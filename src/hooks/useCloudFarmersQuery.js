import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudFarmersQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: true,
    refetchInterval: 10000,
    queryKey: ["app", "cloud", "farmers", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend
        .get("/api/farmers", { signal })
        .catch(() => cloudBackend.get("/api/accounts", { signal }))
        .then((res) => res.data),
  });
}
