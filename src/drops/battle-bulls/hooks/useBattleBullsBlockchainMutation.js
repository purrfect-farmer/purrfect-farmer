import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useBattleBullsBlockchainMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["battle-bulls", "blockchain"],
    mutationFn: (id) =>
      api
        .put("https://api.battle-games.com:8443/api/api/v1/user/blockchain", {
          blockchainId: id,
        })
        .then((res) => res.data.data),
  });
}
