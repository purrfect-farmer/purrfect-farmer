import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useBirdTonClaimDailyRewardMutation() {
  const { api, telegramWebApp } = useFarmerContext();
  return useMutation({
    mutationKey: ["birdton", "daily-reward", "claim"],
    mutationFn: () =>
      api
        .post(
          `https://birdton.site/api/claim_daily?auth=${encodeURIComponent(
            JSON.stringify(telegramWebApp)
          )}`,
          null
        )
        .then((res) => res.data),
  });
}
