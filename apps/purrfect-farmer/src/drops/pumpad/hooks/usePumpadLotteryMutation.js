import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function usePumpadLotteryMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["pumpad", "lottery", "spin"],
    mutationFn: () =>
      api
        .post("https://tg.pumpad.io/referral/api/v1/lottery", null)
        .then((res) => res.data),
  });
}
