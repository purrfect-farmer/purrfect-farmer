import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinClickTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "task", "click"],
    mutationFn: (id) =>
      api
        .post("https://bi.yescoin.gold/task/clickTask", id, {
          headers: { "content-type": "application/json" },
        })
        .then((res) => res.data.data),
  });
}
