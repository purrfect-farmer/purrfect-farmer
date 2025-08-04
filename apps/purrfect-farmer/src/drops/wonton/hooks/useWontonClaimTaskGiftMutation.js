import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonClaimTaskGiftMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "task", "claim-gift"],
    mutationFn: (type) =>
      api
        .get(`https://wonton.food/api/v1/user/claim-task-gift?type=${type}`)
        .then((res) => res.data),
  });
}
