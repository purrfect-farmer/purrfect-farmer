import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useNeubeatDoDailyTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["neubeat", "do-daily-task"],
    mutationFn: (id) =>
      api
        .post("https://tg.audiera.fi/api/doDailyTask", { id })
        .then((res) => res.data),
  });
}
