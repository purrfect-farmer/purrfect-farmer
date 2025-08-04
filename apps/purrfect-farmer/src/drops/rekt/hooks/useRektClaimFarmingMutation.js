import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useRektClaimFarmingMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["rekt", "farming", "claim"],
    mutationFn: (id) =>
      api
        .put(`https://rekt-mini-app.vercel.app/api/farming/${id}/claim`)
        .then((res) => res.data),
  });
}
