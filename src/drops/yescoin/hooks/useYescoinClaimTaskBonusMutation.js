import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinClaimTaskBonusMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "task", "bonus", "claim"],
    mutationFn: (payload) =>
      api
        .post("https://bi.yescoin.gold/task/claimBonus", payload, {
          headers: { "content-type": "application/json" },
        })
        .then((res) => res.data.data),
  });
}
