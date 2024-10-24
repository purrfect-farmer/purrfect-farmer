import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useTadaCompleteMissionMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["tada", "mission", "complete"],
    mutationFn: (id) =>
      api
        .post(
          `https://backend.clutchwalletserver.xyz/activity/v3/missions/${id}/claim`,
          null
        )
        .then((res) => res.data),
  });
}
