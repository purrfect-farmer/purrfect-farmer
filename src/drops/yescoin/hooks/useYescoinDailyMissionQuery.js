import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinDailyMissionQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["yescoin", "mission", "daily"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-backend.yescoin.gold/mission/getDailyMission", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
