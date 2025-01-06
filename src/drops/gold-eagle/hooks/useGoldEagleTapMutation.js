import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";
import { uuid } from "@/lib/utils";

export default function useGoldEagleTapMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["gold-eagle", "tap"],
    mutationFn: (count) =>
      api
        .post("https://gold-eagle-api.fly.dev/tap", {
          ["available_taps"]: 1,
          ["count"]: count,
          ["timestamp"]: Math.floor(Date.now() / 1000),
          salt: uuid(),
        })
        .then((res) => res.data),
  });
}
