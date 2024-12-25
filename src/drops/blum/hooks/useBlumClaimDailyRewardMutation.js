import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useBlumClaimDailyRewardMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["blum", "daily-reward", "claim"],
    mutationFn: () =>
      api
        .post("https://game-domain.blum.codes/api/v2/daily-reward", null)
        .then((res) => res.data),
  });
}
