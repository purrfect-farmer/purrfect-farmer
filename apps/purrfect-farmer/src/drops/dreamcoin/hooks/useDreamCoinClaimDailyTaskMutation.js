import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useDreamCoinClaimDailyTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["dreamcoin", "daily-task", "claim"],
    mutationFn: (id) =>
      api
        .post(`https://api.dreamcoin.ai/DailyTasks/claim/${id}`, {})
        .then((res) => res.data),
  });
}
