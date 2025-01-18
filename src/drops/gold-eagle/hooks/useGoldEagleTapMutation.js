import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";
import { uuid } from "@/lib/utils";

export default function useGoldEagleTapMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["gold-eagle", "tap"],
    mutationFn: ({ taps, available }) =>
      api
        .post("https://gold-eagle-api.fly.dev/tap", {
          ["count"]: taps,
          ["available_taps"]: available,
          ["timestamp"]: Math.floor(Date.now() / 1000),
          salt: uuid(),
        })
        .then((res) => res.data),
  });
}
