import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerUserQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: true,
    queryKey: ["app", "cloud", "manager", "user", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/manager/user", { signal }).then((res) => res.data),
  });
}
