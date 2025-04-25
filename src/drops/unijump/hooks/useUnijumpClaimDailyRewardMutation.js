import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useUnijumpClaimDailyRewardMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["unijump", "claim-daily-reward"],
    mutationFn: () => {
      return api
        .post("https://unijump.xyz/api/v1/player/daily-reward/claim", {})
        .then((res) => res.data);
    },
  });
}
