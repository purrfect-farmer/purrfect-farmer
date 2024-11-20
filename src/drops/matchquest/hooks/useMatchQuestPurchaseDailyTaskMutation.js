import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import useMatchQuestUid from "./useMatchQuestUid";

export default function useMatchQuestPurchaseDailyTaskMutation() {
  const api = useFarmerApi();
  const uid = useMatchQuestUid();

  return useMutation({
    mutationKey: ["matchquest", "daily-task", "purchase"],
    mutationFn: (type) =>
      api
        .post(
          "https://tgapp-api.matchain.io/api/tgapp/v1/daily/task/purchase",
          { type, uid }
        )
        .then((res) => res.data.data),
  });
}
