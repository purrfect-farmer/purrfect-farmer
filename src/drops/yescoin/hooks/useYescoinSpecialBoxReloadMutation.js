import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinSpecialBoxReloadMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "special-box", "reload"],
    mutationFn: () =>
      api
        .post(
          "https://api-backend.yescoin.gold/game/specialBoxReloadPage",
          null,
          {
            headers: { "content-type": "application/json" },
          }
        )
        .then((res) => res.data.data),
  });
}
