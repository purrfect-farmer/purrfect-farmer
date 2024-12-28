import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useBattleBullsClaimTaskMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["battle-bulls", "task", "claim"],
    mutationFn: (id) =>
      api
        .post(
          `https://api.battle-games.com:8443/api/api/v1/tasks/${id}/complete`,
          null
        )
        .then((res) => res.data.data),
  });
}
