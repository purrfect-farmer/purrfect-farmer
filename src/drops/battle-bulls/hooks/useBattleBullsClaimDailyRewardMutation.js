import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useBattleBullsClaimDailyRewardMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["battle-bulls", "daily-reward", "claim"],
    mutationFn: () =>
      api
        .post(
          "https://api.battle-games.com:8443/api/api/v1/tasks/streak_days/complete",
          null
        )
        .then((res) => res.data.data),
  });
}
