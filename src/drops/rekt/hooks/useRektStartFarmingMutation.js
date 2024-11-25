import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useRektStartFarmingMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["rekt", "farming", "start"],
    mutationFn: () =>
      api
        .put("https://rekt-mini-app.vercel.app/api/farming/start")
        .then((res) => res.data),
  });
}
