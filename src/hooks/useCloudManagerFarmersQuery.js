import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerFarmersQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: true,
    refetchInterval: 10000,
    queryKey: ["app", "cloud", "manager", "farmers", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend
        .get("/api/manager/farmers", { signal })
        .then((res) => res.data),
  });
}
