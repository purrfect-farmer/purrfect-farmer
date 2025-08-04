import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useDreamCoinLevelQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["dreamcoin", "level"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.dreamcoin.ai/Levels/current", {
          signal,
        })
        .then((res) => res.data),
  });
}
