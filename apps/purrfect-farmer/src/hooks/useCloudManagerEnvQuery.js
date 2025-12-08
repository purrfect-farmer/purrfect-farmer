import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerEnvQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: true,
    queryKey: ["app", "cloud", "manager", "env", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/manager/env", { signal }).then((res) => res.data),
  });
}
