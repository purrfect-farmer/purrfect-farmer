import AppContext from "@/contexts/AppContext";
import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";

export default function useSeekerQuery() {
  const { settings, seekerBackend } = useContext(AppContext);

  return useQuery({
    enabled: settings.enableSeeker,
    queryKey: ["core", "seeker", "list", settings.seekerServer],
    queryFn: ({ signal }) =>
      seekerBackend.get("/api/servers", { signal }).then((res) => res.data),
  });
}
