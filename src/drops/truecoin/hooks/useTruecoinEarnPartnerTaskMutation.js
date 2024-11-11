import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useTruecoinEarnPartnerTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["truecoin", "earn", "task"],
    mutationFn: (taskId) =>
      api
        .post("https://api.true.world/api/partners/earnPartnerTask", {
          taskId,
        })
        .then((res) => res.data),
  });
}
