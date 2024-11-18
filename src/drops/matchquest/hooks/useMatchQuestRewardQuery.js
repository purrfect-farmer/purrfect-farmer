import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

import useMatchQuestUid from "./useMatchQuestUid";

export default function useMatchQuestRewardQuery() {
  const api = useFarmerApi();
  const uid = useMatchQuestUid();

  return useQuery({
    queryKey: ["matchquest", "reward", uid],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://tgapp-api.matchain.io/api/tgapp/v1/point/reward",
          { uid },
          {
            signal,
          }
        )
        .then((res) => res.data.data),
  });
}
