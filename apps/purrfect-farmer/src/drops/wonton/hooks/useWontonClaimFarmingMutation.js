import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonClaimFarmingMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "farming", "claim"],
    mutationFn: () =>
      api
        .post("https://wonton.food/api/v1/user/farming-claim", null)
        .then((res) => res.data),
  });
}
