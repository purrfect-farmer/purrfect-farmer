import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useFunaticStartQuestMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["funatic", "quest", "start"],
    mutationFn: (id) =>
      api
        .post(`https://clicker.api.funtico.com/quests/${id}/start`, null)
        .then((res) => res.data),
  });
}
