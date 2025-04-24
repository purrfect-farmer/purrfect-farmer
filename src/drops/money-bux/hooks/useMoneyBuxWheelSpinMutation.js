import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMoneyBuxWheelSpinMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["money-bux", "wheel-spin"],
    mutationFn: (data) =>
      api
        .post(
          "https://moneybux.xyz/games/wheel_spin",
          new URLSearchParams(data)
        )
        .then((res) => res.data),
  });
}
