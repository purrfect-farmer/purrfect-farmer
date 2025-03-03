import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudStatusQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    enabled: settings.enableCloud,
    queryKey: ["core", "cloud", "status", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/server", { signal }).then((res) => res.data),
  });
}
