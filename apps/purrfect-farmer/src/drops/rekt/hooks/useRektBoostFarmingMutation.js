import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useRektBoostFarmingMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["rekt", "farming", "boost"],
    mutationFn: () =>
      api
        .put("https://rekt-mini-app.vercel.app/api/farming/active/boost")
        .then((res) => res.data),
  });
}
