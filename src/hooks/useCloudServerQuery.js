import { useQuery } from "@tanstack/react-query";

import useCloudContext from "./useCloudContext";

export default function useCloudServerQuery() {
  const { cloudBackend } = useCloudContext();

  return useQuery({
    retry: true,
    queryKey: ["core", "cloud", "server"],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/server", { signal }).then((res) => res.data),
  });
}
