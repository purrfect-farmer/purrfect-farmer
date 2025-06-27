import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useGoldEagleClaimMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["gold-eagle", "claim"],
    mutationFn: () =>
      api
        .post("https://gold-eagle-api.fly.dev/wallet/claim")
        .then((res) => res.data),
  });
}
