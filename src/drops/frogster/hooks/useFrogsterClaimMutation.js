import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useFrogsterClaimMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["frogster", "claim"],
    mutationFn: () =>
      api
        .post(
          "https://frogster.app/api/wallets/claim?claim_plan_type=1&currency=TON"
        )
        .then((res) => res.data.result),
  });
}
