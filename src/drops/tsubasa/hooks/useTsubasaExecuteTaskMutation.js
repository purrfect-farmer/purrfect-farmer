import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useTsubasaExecuteTaskMutation() {
  const { api, initData } = useFarmerContext();
  return useMutation({
    mutationKey: ["tsubasa", "task", "execute"],
    mutationFn: (id) =>
      api
        .post("https://api.app.ton.tsubasa-rivals.com/api/task/execute", {
          initData,
          ["task_id"]: id,
        })
        .then((res) => res.data),
  });
}
