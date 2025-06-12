import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useNeubeatClaimMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["neubeat", "claim"],
    mutationFn: () =>
      api
        .post(
          "https://neubeat.app/api/wallets/claim?claim_plan_type=1&currency=TON"
        )
        .then((res) => res.data.result),
  });
}
