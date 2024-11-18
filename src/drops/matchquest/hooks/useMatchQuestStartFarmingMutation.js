import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import useMatchQuestUid from "./useMatchQuestUid";

export default function useMatchQuestStartFarmingMutation() {
  const api = useFarmerApi();
  const uid = useMatchQuestUid();

  return useMutation({
    mutationKey: ["matchquest", "farming", "start"],
    mutationFn: () =>
      api
        .post(
          "https://tgapp-api.matchain.io/api/tgapp/v1/point/reward/farming",
          { uid }
        )
        .then((res) => res.data.data),
  });
}
