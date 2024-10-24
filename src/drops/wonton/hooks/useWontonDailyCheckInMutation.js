import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useWontonDailyCheckInMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["wonton", "daily-check-in"],
    mutationFn: () =>
      api.get("https://wonton.food/api/v1/checkin").then((res) => res.data),
  });
}
