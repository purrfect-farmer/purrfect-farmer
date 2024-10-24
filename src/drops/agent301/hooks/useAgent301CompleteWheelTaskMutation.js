import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useAgent301CompleteWheelTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["agent301", "wheel", "task", "complete"],
    mutationFn: (data) =>
      api
        .post("https://api.agent301.org/wheel/task", data)
        .then((res) => res.data),
  });
}
