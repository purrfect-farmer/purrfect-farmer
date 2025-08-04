import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useCEXCheckTaskMutation() {
  const { api, payload } = useFarmerContext();
  return useMutation({
    mutationKey: ["cex", "task", "check"],
    mutationFn: (taskId) =>
      api
        .post("https://app.cexptap.com/api/v2/checkTask", {
          ...payload,
          data: {
            taskId,
          },
        })
        .then((res) => res.data),
  });
}
