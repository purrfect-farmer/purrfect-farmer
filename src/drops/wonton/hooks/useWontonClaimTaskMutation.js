import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonClaimTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "task", "claim"],
    mutationFn: (id) =>
      api
        .post("https://wonton.food/api/v1/task/claim", { taskId: id })
        .then((res) => res.data),
  });
}
