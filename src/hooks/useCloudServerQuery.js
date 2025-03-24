import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudServerQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryKey: ["app", "cloud", "server", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/server", { signal }).then((res) => res.data),
  });
}
