import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import useBitsToken from "./useBitsToken";

export default function useBitsCollectDailyRewardMutation() {
  const api = useFarmerApi();
  const token = useBitsToken();

  return useMutation({
    mutationKey: ["bits", "daily-reward", "collect"],
    mutationFn: (day) =>
      api
        .post(
          `https://api-bits.apps-tonbox.me/api/v1/daily-reward/${day}/collect?access_token=${token}`,
          null
        )
        .then((res) => res.data),
  });
}
