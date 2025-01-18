import useFarmerApi from "@/hooks/useFarmerApi";
import { totp } from "otplib";
import { useMutation } from "@tanstack/react-query";
import { uuid } from "@/lib/utils";

export default function useGoldEagleTapMutation(hex) {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["gold-eagle", "tap"],
    mutationFn: ({ taps, available }) => {
      const nonce = btoa(totp.generate(hex));
      const body = {
        nonce,
        ["count"]: taps,
        ["available_taps"]: available,
        ["timestamp"]: Math.floor(Date.now() / 1000),
        salt: uuid(),
      };

      return api
        .post("https://gold-eagle-api.fly.dev/tap", body)
        .then((res) => res.data);
    },
  });
}
