import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonClaimTaskProgressMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "task", "claim-progress"],
    mutationFn: () =>
      api
        .get("https://wonton.food/api/v1/task/claim-progress")
        .then((res) => res.data),
  });
}
