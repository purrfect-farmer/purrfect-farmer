import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonStartTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "task", "verify"],
    mutationFn: (id) =>
      api
        .post("https://wonton.food/api/v1/task/verify", { taskId: id })
        .then((res) => res.data),
  });
}
