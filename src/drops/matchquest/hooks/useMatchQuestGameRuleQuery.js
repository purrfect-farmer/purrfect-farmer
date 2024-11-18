import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMatchQuestGameRuleQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["matchquest", "game", "rule"],
    queryFn: ({ signal }) =>
      api
        .get("https://tgapp-api.matchain.io/api/tgapp/v1/game/rule", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
