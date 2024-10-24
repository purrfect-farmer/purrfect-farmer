import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useTruecoin50SpinsBoost() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["truecoin", "boost", 50, "spins"],
    mutationFn: () =>
      api
        .post("https://api.true.world/api/boosts/buy", {
          code: "50_ad_additional_spins",
        })
        .then((res) => res.data),
  });
}
