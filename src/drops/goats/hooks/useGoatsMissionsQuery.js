import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useGoatsMissionsQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["goats", "missions"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-mission.goatsbot.xyz/missions/user", {
          signal,
        })
        .then((res) => res.data),
  });
}
