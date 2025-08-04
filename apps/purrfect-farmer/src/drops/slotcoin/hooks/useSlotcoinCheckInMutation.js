import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useSlotcoinCheckInMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["slotcoin", "check-in", "claim"],
    mutationFn: () =>
      api
        .post("https://api.slotcoin.app/v1/clicker/check-in/claim", {})
        .then((res) => res.data),
  });
}
