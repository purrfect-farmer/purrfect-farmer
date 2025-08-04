import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useMidasDailyCheckInMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["midas", "daily-check-in"],
    mutationFn: () =>
      api
        .post("https://api-tg-app.midas.app/api/streak", null)
        .then((res) => res.data),
  });
}
