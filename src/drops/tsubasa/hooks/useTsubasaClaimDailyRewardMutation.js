import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useTsubasaClaimDailyRewardMutation() {
  const { api, initData } = useFarmerContext();
  return useMutation({
    mutationKey: ["tsubasa", "daily-reward", "claim"],
    mutationFn: () =>
      api
        .post("https://api.app.ton.tsubasa-rivals.com/api/daily_reward/claim", {
          initData,
        })
        .then((res) => res.data),
  });
}
