import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useRektClaimQuestMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["rekt", "quest", "claim"],
    mutationFn: (id) =>
      api
        .post(`https://rekt-mini-app.vercel.app/api/quests/claim/${id}`, null)
        .then((res) => res.data),
  });
}
