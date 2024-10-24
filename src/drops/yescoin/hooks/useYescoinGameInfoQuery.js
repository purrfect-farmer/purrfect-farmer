import useFarmerApi from "@/hooks/useFarmerApi";
import { useIsMutating, useQuery } from "@tanstack/react-query";

export default function useYescoinGameInfoQuery() {
  const api = useFarmerApi();
  const isMutating = useIsMutating({ mutationKey: ["yescoin"] });

  return useQuery({
    refetchInterval: isMutating < 1 ? 5000 : false,
    queryKey: ["yescoin", "game", "info"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-backend.yescoin.gold/game/getGameInfo", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
