import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useBlumDailyRewardQuery() {
  const api = useFarmerApi();

  return useQuery({
    refetchInterval: false,
    queryKey: ["blum", "daily-reward", "get"],
    queryFn: ({ signal }) =>
      api
        .get("https://game-domain.blum.codes/api/v2/daily-reward", {
          signal,
        })
        .then((res) => res.data),
  });
}
