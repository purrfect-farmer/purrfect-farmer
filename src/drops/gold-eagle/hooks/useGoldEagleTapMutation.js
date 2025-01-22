import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import { calculateGoldEagleData } from "../lib/utils";

export default function useGoldEagleTapMutation(hex) {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["gold-eagle", "tap"],
    mutationFn: (taps) => {
      const body = {
        data: calculateGoldEagleData(taps),
      };

      return api
        .post("https://gold-eagle-api.fly.dev/tap", body)
        .then((res) => res.data);
    },
  });
}
