import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useRektCompleteQuestMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["rekt", "quest", "complete"],
    mutationFn: (id) =>
      api
        .post(
          `https://rekt-mini-app.vercel.app/api/quests/complete/${id}`,
          null
        )
        .then((res) => res.data),
  });
}
