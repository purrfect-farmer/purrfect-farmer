import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useCEXStartTaskMutation() {
  const { api, payload } = useFarmerContext();
  return useMutation({
    mutationKey: ["cex", "task", "start"],
    mutationFn: (taskId) =>
      api
        .post("https://app.cexptap.com/api/v2/startTask", {
          ...payload,
          data: {
            taskId,
          },
        })
        .then((res) => res.data),
  });
}
