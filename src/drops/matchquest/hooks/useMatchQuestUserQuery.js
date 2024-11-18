import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

import useMatchQuestUid from "./useMatchQuestUid";

export default function useMatchQuestUserQuery() {
  const api = useFarmerApi();
  const uid = useMatchQuestUid();

  return useQuery({
    queryKey: ["matchquest", "user", uid],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://tgapp-api.matchain.io/api/tgapp/v1/user/profile",
          { uid },
          {
            signal,
          }
        )
        .then((res) => res.data.data),
  });
}
