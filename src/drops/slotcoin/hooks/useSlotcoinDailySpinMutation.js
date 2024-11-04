import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useSlotcoinDailySpinMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["slotcoin", "daily", "spin"],
    mutationFn: () =>
      api
        .post("https://api.slotcoin.app/v1/clicker/daily/spin", {})
        .then((res) => res.data),
  });
}
