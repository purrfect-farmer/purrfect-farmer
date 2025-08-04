import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useDiggerDigMutation() {
  const { api, telegramWebApp } = useFarmerContext();

  return useMutation({
    mutationKey: ["digger", "dig"],
    mutationFn: () =>
      api
        .post("https://api.diggergame.app/api/play/dig", {
          ["init_data"]: telegramWebApp.initData,
          ["platform"]: telegramWebApp.platform,
        })
        .then((res) => res.data.result),
  });
}
