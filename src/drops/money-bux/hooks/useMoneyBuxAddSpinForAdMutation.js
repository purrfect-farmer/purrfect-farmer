import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMoneyBuxAddSpinForAdMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["money-bux", "add-spin-for-ad"],
    mutationFn: (hash) =>
      api
        .post(
          "https://moneybux.xyz/games/add_spin_for_ad",
          new URLSearchParams({
            hash,
          })
        )
        .then((res) => res.data),
  });
}
