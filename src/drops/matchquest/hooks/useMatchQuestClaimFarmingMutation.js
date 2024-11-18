import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import useMatchQuestUid from "./useMatchQuestUid";

export default function useMatchQuestClaimFarmingMutation() {
  const api = useFarmerApi();
  const uid = useMatchQuestUid();

  return useMutation({
    mutationKey: ["matchquest", "farming", "claim"],
    mutationFn: () =>
      api
        .post("https://tgapp-api.matchain.io/api/tgapp/v1/point/reward/claim", {
          uid,
        })
        .then((res) => res.data.data),
  });
}
