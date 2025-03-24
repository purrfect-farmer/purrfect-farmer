import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudUserQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: true,
    queryKey: ["app", "cloud", "user", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/user", { signal }).then((res) => res.data),
  });
}
