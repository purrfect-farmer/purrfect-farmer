import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useSeekerServerQuery(app) {
  const context = useAppContext();
  const { settings, seekerBackend } = app ?? context;

  return useQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    enabled: settings.enableSeeker && Boolean(settings.seekerId),
    queryKey: [
      "core",
      "seeker",
      "server",
      settings.seekerServer,
      settings.seekerId,
    ],
    queryFn: ({ signal }) =>
      seekerBackend
        .get(`/api/servers/${settings.seekerId}`, { signal })
        .then((res) => res.data),
  });
}
