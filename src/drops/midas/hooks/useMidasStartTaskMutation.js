import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMidasStartTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["midas", "task", "start"],
    mutationFn: (id) =>
      api
        .post(`https://api-tg-app.midas.app/api/tasks/start/${id}`, null)
        .then((res) => res.data),
  });
}
