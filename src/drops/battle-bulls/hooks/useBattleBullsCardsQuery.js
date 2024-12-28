import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useBattleBullsCardsQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["battle-bulls", "cards"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.battle-games.com:8443/api/api/v1/cards", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
