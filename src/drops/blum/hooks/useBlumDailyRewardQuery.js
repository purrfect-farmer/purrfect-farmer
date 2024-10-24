import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useBlumDailyRewardQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["blum", "daily-reward", "get"],
    queryFn: ({ signal }) =>
      api
        .get("https://game-domain.blum.codes/api/v1/daily-reward?offset=-60", {
          signal,
        })
        .then((res) => res.data),
  });
}
