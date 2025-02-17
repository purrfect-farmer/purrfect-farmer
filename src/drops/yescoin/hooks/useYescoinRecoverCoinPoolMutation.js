import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinRecoverCoinPoolMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "recover", "coin-pool", "claim"],
    mutationFn: () =>
      api
        .post("https://api-backend.yescoin.fun/game/recoverCoinPool")
        .then((res) => res.data.data),
  });
}
