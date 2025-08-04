import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useRektDailyCheckInMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["rekt", "daily-check-in", "claim"],
    mutationFn: () =>
      api
        .put("https://rekt-mini-app.vercel.app/api/check-in")
        .then((res) => res.data),
  });
}
