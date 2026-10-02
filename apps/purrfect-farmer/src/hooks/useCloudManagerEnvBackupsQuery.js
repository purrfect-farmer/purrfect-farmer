import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerEnvBackupsQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    queryKey: ["app", "cloud", "manager", "env", "backups", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend
        .get("/api/manager/env/backups", { signal })
        .then((res) => res.data),
  });
}
