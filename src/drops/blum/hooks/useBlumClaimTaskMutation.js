import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useBlumClaimTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["blum", "task", "claim"],
    mutationFn: ({ id }) =>
      api
        .post(`https://earn-domain.blum.codes/api/v1/tasks/${id}/claim`, null)
        .then((res) => res.data),
  });
}
