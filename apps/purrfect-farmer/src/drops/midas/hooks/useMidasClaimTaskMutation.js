import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMidasClaimTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["midas", "task", "claim"],
    mutationFn: (id) =>
      api
        .post(`https://api-tg-app.midas.app/api/tasks/claim/${id}`, null)
        .then((res) => res.data),
  });
}
