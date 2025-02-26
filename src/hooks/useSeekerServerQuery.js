import AppContext from "@/contexts/AppContext";
import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";

export default function useSeekerServerQuery(app) {
  const context = useContext(AppContext);
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
