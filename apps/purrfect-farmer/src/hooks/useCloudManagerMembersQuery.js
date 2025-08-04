import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerMembersQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: true,
    refetchInterval: 10000,
    queryKey: ["app", "cloud", "manager", "members", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend
        .get("/api/manager/members", { signal })
        .then((res) => res.data),
  });
}
