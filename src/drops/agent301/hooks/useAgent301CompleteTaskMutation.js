import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useAgent301CompleteTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["agent301", "task", "complete"],
    mutationFn: (data) =>
      api
        .post("https://api.agent301.org/completeTask", data)
        .then((res) => res.data),
  });
}
