import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useHorseGoCompleteTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["horse-go", "task", "complete"],
    mutationFn: (id) =>
      api
        .post(`https://api.horsego.vip/user_api/completeTask?taskId=${id}`)
        .then((res) => res.data.data),
  });
}
