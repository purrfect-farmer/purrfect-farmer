import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useSlotcoinCheckTaskMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["slotcoin", "task", "check"],
    mutationFn: (id) =>
      api
        .post("https://api.slotcoin.app/v1/clicker/quests/check", {
          taskId: id.toString(),
        })
        .then((res) => res.data),
  });
}
