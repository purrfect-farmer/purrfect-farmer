import { useQuery } from "@tanstack/react-query";

import useCloudContext from "./useCloudContext";

export default function useCloudUserQuery() {
  const { settings, cloudBackend } = useCloudContext();

  return useQuery({
    retry: true,
    queryKey: ["core", "cloud", "user", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/user", { signal }).then((res) => res.data),
  });
}
