import AppContext from "@/contexts/AppContext";
import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";

export default function useCloudStatusQuery() {
  const { settings, cloudBackend } = useContext(AppContext);

  return useQuery({
    enabled: settings.enableCloud,
    queryKey: ["core", "cloud", "status", settings.cloudServer],
    queryFn: ({ signal }) =>
      cloudBackend.get("/api/server", { signal }).then((res) => res.data),
  });
}
