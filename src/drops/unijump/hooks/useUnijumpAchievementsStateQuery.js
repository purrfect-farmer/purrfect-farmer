import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useUnijumpAchievementsStateQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["unijump", "achievements", "state"],
    queryFn: ({ signal }) =>
      api
        .get("https://unijump.xyz/api/v1/achievements/state", {
          signal,
        })
        .then((res) => res.data),
  });
}
