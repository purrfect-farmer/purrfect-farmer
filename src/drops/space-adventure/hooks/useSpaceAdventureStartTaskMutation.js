import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureStartTaskMutation() {
  const { api, getApiHeaders } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "task", "start"],
    mutationFn: async (id) =>
      api
        .post(
          "https://space-adventure.online/api/tasks/start/",
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
