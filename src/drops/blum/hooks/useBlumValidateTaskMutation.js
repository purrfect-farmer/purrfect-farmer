import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useBlumValidateTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["blum", "task", "validate"],
    mutationFn: ({ id, keyword }) =>
      api
        .post(`https://earn-domain.blum.codes/api/v1/tasks/${id}/validate`, {
          keyword,
        })
        .then((res) => res.data),
  });
}
