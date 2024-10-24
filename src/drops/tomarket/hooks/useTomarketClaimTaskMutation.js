import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useTomarketClaimTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["tomarket", "task", "claim"],
    mutationFn: (id) =>
      api
        .post("https://api-web.tomarket.ai/tomarket-game/v1/tasks/claim", {
          task_id: id,
        })
        .then((res) => res.data.data),
  });
}
