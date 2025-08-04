import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useTomarketDailyCheckInMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["tomarket", "daily", "check-in"],
    mutationFn: (id) =>
      api
        .post("https://api-web.tomarket.ai/tomarket-game/v1/daily/claim", {
          game_id: id,
        })
        .then((res) => res.data),
  });
}
