import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinClaimMissionMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "mission", "claim"],
    mutationFn: (id) =>
      api
        .post("https://api-backend.yescoin.gold/mission/claimReward", id, {
          headers: { "content-type": "application/json" },
        })
        .then((res) => res.data.data),
  });
}
