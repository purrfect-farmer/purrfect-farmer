import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useTsubasaClaimTaskMutation() {
  const { api, initData } = useFarmerContext();
  return useMutation({
    mutationKey: ["tsubasa", "task", "claim"],
    mutationFn: (id) =>
      api
        .post("https://api.app.ton.tsubasa-rivals.com/api/task/achievement", {
          initData,
          ["task_id"]: id,
        })
        .then((res) => res.data),
  });
}
