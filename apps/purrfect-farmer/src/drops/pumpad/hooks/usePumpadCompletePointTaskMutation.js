import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function usePumpadCompletePointTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["pumpad", "point-task", "complete"],
    mutationFn: (id) =>
      api
        .post(
          "https://tg.pumpad.io/referral/api/v1/tg/member/complete_points_task",
          {
            ["task_id"]: id,
            ["task_type"]: "WATCH_AD",
          }
        )
        .then((res) => res.data),
  });
}
