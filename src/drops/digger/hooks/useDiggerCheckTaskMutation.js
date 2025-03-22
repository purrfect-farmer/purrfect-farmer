import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useDiggerCheckTaskMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["digger", "check-task"],
    mutationFn: (type) =>
      api
        .post("https://api.diggergame.app/api/user-task/check", { type })
        .then((res) => res.data.result),
  });
}
