import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureStartTaskMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "task", "start"],
    mutationFn: (id) =>
      api
        .post("https://space-adventure.online/api/tasks/start/", {
          id,
        })
        .then((res) => res.data),
  });
}
