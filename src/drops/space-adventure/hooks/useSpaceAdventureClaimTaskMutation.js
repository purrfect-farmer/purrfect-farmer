import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureClaimTaskMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "task", "claim"],
    mutationFn: (id) =>
      api
        .post("https://space-adventure.online/api/tasks/reward/", {
          id,
        })
        .then((res) => res.data),
  });
}
