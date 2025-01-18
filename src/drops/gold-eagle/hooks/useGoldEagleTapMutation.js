import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";
import { uuid } from "@/lib/utils";
import { totp } from "otplib";

export default function useGoldEagleTapMutation(hex) {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["gold-eagle", "tap"],
    mutationFn: ({ taps, available }) => {
      const nonce = btoa(totp.generate(hex));

      return api
        .post("https://gold-eagle-api.fly.dev/tap", {
          nonce,
          ["count"]: taps,
          ["available_taps"]: available,
          ["timestamp"]: Math.floor(Date.now() / 1000),
          salt: uuid(),
        })
        .then((res) => res.data);
    },
  });
}
