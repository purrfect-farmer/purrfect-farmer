import { useQuery } from "@tanstack/react-query";

import useCloudContext from "./useCloudContext";

export default function useCloudUserQuery() {
  const { cloudBackend } = useCloudContext();

  return useQuery({
    queryKey: ["core", "cloud", "user"],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/user", { signal }).then((res) => res.data),
  });
}
