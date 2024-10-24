import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useBlumClaimFarmingMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["blum", "farming", "claim"],
    mutationFn: () =>
      api
        .post("https://game-domain.blum.codes/api/v1/farming/claim", null)
        .then((res) => res.data),
  });
}
