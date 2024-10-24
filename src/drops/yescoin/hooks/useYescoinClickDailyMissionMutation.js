import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinClickDailyMissionMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "mission", "daily", "click"],
    mutationFn: (id) =>
      api
        .post(
          "https://api-backend.yescoin.gold/mission/clickDailyMission",
          id,
          {
            headers: { "content-type": "application/json" },
          }
        )
        .then((res) => res.data.data),
  });
}
