import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useDiggerUpdateTaskMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["digger", "update-task"],
    mutationFn: (type) =>
      api
        .post("https://api.diggergame.app/api/user-task/update", { type })
        .then((res) => res.data.result),
  });
}
