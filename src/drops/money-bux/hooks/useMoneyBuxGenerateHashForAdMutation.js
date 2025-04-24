import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMoneyBuxGenerateHashForAdMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["money-bux", "generate-hash-for-ad"],
    mutationFn: () =>
      api
        .post("https://moneybux.xyz/games/gen_hash_for_ad")
        .then((res) => res.data),
  });
}
