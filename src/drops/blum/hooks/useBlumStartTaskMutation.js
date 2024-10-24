import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useBlumStartTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["blum", "task", "start"],
    mutationFn: (id) =>
      api
        .post(`https://earn-domain.blum.codes/api/v1/tasks/${id}/start`, null)
        .then((res) => res.data),
  });
}
