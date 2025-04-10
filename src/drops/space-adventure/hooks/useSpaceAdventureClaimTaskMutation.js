import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureClaimTaskMutation() {
  const { api, getApiHeaders } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "task", "claim"],
    mutationFn: async (id) =>
      api
        .post(
          "https://space-adventure.online/api/tasks/reward/",
          {
            id,
          },
          {
            headers: await getApiHeaders(),
          }
        )
        .then((res) => res.data),
  });
}
