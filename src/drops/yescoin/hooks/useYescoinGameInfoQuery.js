import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinGameInfoQuery() {
  const api = useFarmerApi();

  return useQuery({
    meta: {
      defaultRefetchInterval: 5000,
    },
    queryKey: ["yescoin", "game", "info"],
    queryFn: ({ signal }) =>
      api
        .get("https://bi.yescoin.gold/game/getGameInfo", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
