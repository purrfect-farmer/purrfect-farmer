import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useYescoinCheckDailyMissionMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["yescoin", "mission", "daily", "check"],
    mutationFn: (id) =>
      api
        .post(
          "https://api-backend.yescoin.gold/mission/checkDailyMission",
          id,
          {
            headers: { "content-type": "application/json" },
          }
        )
        .then((res) => res.data.data),
  });
}
