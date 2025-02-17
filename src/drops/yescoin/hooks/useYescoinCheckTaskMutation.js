import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinCheckTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "task", "check"],
    mutationFn: (id) =>
      api
        .post("https://api-backend.yescoin.fun/task/checkTask", id, {
          headers: { "content-type": "application/json" },
        })
        .then((res) => res.data.data),
  });
}
