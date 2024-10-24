import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useBirdTonFortuneSpinMutation() {
  const { api, telegramWebApp } = useFarmerContext();
  return useMutation({
    mutationKey: ["birdton", "fortune", "spin"],
    mutationFn: () =>
      api
        .post(
          `https://birdton.site/api/fortune_spin?auth=${encodeURIComponent(
            JSON.stringify(telegramWebApp)
          )}`,
          null
        )
        .then((res) => res.data),
  });
}
