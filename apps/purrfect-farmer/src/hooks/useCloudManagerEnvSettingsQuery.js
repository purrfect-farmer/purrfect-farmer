import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerEnvSettingsQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: (count, error) => error.response?.status !== 404 && count < 3,
    /** A refetch remounts the form and drops open groups and edits */
    refetchOnWindowFocus: false,
    refetchInterval: false,
    queryKey: ["app", "cloud", "manager", "env", "settings", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend
        .get("/api/manager/env/settings", { signal })
        .then((res) => res.data),
  });
}
