import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudMembersQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: true,
    refetchInterval: 10000,
    queryKey: ["app", "cloud", "members", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/members", { signal }).then((res) => res.data),
  });
}
