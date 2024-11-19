import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinClaimTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "task", "claim"],
    mutationFn: (id) =>
      api
        .post("https://bi.yescoin.gold/task/claimTaskReward", id, {
          headers: { "content-type": "application/json" },
        })
        .then((res) => res.data.data),
  });
}
