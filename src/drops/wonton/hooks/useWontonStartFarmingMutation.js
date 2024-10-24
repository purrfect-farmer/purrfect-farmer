import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonStartFarmingMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "farming", "start"],
    mutationFn: () =>
      api
        .post("https://wonton.food/api/v1/user/start-farming", null)
        .then((res) => res.data),
  });
}
