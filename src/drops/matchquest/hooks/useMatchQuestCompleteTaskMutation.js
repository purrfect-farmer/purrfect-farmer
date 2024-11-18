import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import useMatchQuestUid from "./useMatchQuestUid";

export default function useMatchQuestCompleteTaskMutation() {
  const api = useFarmerApi();
  const uid = useMatchQuestUid();

  return useMutation({
    mutationKey: ["matchquest", "task", "complete"],
    mutationFn: (type) =>
      api
        .post(
          "https://tgapp-api.matchain.io/api/tgapp/v1/point/task/complete",
          { type, uid }
        )
        .then((res) => res.data.data),
  });
}
