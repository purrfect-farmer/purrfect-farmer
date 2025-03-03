import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudFarmersQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    enabled: settings.enableCloud,
    queryKey: ["core", "cloud", "farmers", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/farmers", { signal }).then((res) => res.data),
  });
}
