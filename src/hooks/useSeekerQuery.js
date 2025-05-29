import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useSeekerQuery() {
  const { settings, seekerBackend } = useAppContext();

  return useQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    enabled: settings.enableSeeker,
    queryKey: ["core", "seeker", "list", settings.seekerServer],
    queryFn: ({ signal }) =>
      seekerBackend.get("/api/servers", { signal }).then((res) => res.data),
  });
}
