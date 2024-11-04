import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function usePumpadCheckInMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["pumpad", "check-in", "claim"],
    mutationFn: () =>
      api
        .post("https://tg.pumpad.io/referral/api/v1/tg/raffle/checkin", null)
        .then((res) => res.data),
  });
}
