import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useCEXClaimTaskMutation() {
  const { api, payload } = useFarmerContext();
  return useMutation({
    mutationKey: ["cex", "task", "claim"],
    mutationFn: (taskId) =>
      api
        .post("https://app.cexptap.com/api/v2/claimTask", {
          ...payload,
          data: {
            taskId,
          },
        })
        .then((res) => res.data),
  });
}
