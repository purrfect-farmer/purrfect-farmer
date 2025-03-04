import { useQuery } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudServerQuery() {
  const { settings, cloudBackend } = useAppContext();

  return useQuery({
    retry: true,
    queryKey: ["core", "cloud", "server", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/server", { signal }).then((res) => res.data),
  });
}
