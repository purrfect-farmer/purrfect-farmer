import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useBlumStartFarmingMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["blum", "farming", "start"],
    mutationFn: () =>
      api
        .post("https://game-domain.blum.codes/api/v1/farming/start", null)
        .then((res) => res.data),
  });
}
