import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

import { getZooHeaders } from "../lib/utils";

export default function useZooFinishOnboardingMutation() {
  const { api, telegramWebApp } = useFarmerContext();

  return useMutation({
    mutationKey: ["zoo", "onboarding", "finish"],
    mutationFn: () => {
      const body = {
        data: 1,
      };

      return api
        .post("https://api.zoo.team/hero/onboarding/finish", body, {
          headers: getZooHeaders(body, telegramWebApp.initDataUnsafe["hash"]),
        })
        .then((res) => res.data.data);
    },
  });
}
