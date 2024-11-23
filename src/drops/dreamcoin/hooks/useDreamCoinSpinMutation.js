import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useDreamCoinSpinMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["dreamcoin", "lottery", "spin"],
    mutationFn: (multiplier = 1) =>
      api
        .post("https://api.dreamcoin.ai/Slot/spin", { multiplier })
        .then((res) => res.data),
  });
}
