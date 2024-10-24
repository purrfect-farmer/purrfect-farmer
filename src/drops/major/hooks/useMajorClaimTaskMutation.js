import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMajorClaimTaskMutation() {
  const api = useFarmerApi();

  return useMutation({
    mutationKey: ["major", "task", "claim"],
    mutationFn: (id) =>
      api
        .post("https://major.bot/api/tasks/", { task_id: id })
        .then((res) => res.data),
  });
}
