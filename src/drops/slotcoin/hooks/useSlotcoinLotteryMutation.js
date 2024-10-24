import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useSlotcoinLotteryMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["slotcoin", "lottery", "spin"],
    mutationFn: () =>
      api
        .post("https://api.slotcoin.app/v1/clicker/api/spin", null)
        .then((res) => res.data),
  });
}
