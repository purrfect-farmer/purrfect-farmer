import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinGameInfoQuery() {
  const api = useFarmerApi();

  return useQuery({
    refetchInterval: 5000,
    queryKey: ["yescoin", "game", "info"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-backend.yescoin.fun/game/getGameInfo", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
