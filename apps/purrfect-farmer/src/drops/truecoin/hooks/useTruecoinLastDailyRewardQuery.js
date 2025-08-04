import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useTruecoinLastDailyRewardQuery() {
  const api = useFarmerApi();

  return useQuery({
    refetchInterval: false,
    queryKey: ["truecoin", "daily", "last-reward"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.true.world/api/dailyReward/getLastReward", {
          signal,
        })
        .then((res) => res.data),
  });
}
