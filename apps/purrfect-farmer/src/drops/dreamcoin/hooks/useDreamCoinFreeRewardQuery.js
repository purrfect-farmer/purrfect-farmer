import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useDreamCoinFreeRewardQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["dreamcoin", "free-reward", "get"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.dreamcoin.ai/FreeReward/current", {
          signal,
        })
        .then((res) => res.data),
  });
}
