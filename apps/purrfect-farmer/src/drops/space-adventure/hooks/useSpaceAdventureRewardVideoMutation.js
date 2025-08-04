import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureRewardVideoMutation() {
  const { api, getApiHeaders } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "reward-video"],
    mutationFn: async () =>
      api
        .put("https://space-adventure.online/api/tasks/reward-video/", null, {
          headers: await getApiHeaders(),
        })
        .then((res) => res.data),
  });
}
