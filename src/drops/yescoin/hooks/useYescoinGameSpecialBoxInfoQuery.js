import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinGameSpecialBoxInfoQuery(options) {
  const api = useFarmerApi();

  return useQuery({
    ...options,
    meta: {
      defaultRefetchInterval: 5000,
    },
    queryKey: ["yescoin", "game", "special-box-info"],
    queryFn: ({ signal }) =>
      api
        .get("https://bi.yescoin.gold/game/getSpecialBoxInfo", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
