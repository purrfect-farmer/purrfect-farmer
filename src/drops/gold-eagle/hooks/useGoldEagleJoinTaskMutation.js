import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useGoldEagleJoinTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["gold-eagle", "task", "join"],
    mutationFn: (id) =>
      api
        .post("https://gold-eagle-api.fly.dev/task/join", {
          ["task_id"]: id,
        })
        .then((res) => res.data),
  });
}
