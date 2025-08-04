import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useFunaticClaimQuestMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["funatic", "quest", "claim"],
    mutationFn: (id) =>
      api
        .post(`https://clicker.api.funtico.com/quests/${id}/claim`, null)
        .then((res) => res.data),
  });
}
