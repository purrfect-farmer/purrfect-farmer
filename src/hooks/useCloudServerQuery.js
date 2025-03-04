import { useQuery } from "@tanstack/react-query";

import useCloudContext from "./useCloudContext";

export default function useCloudServerQuery() {
  const { settings, cloudBackend } = useCloudContext();

  return useQuery({
    retry: true,
    queryKey: ["core", "cloud", "server", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/server", { signal }).then((res) => res.data),
  });
}
