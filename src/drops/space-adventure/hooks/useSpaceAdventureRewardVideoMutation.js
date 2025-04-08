import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureRewardVideoMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "reward-video"],
    mutationFn: () =>
      api
        .put("https://space-adventure.online/api/tasks/reward-video/")
        .then((res) => res.data),
  });
}
