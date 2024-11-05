import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

import useBitsToken from "./useBitsToken";

export default function useBitsPassiveFarmingQuery() {
  const api = useFarmerApi();
  const token = useBitsToken();

  return useQuery({
    queryKey: ["bits", "passive", "get"],
    queryFn: ({ signal }) =>
      api
        .get(
          `https://api-bits.apps-tonbox.me/api/v1/passive?access_token=${token}`,
          {
            signal,
          }
        )
        .then((res) => res.data),
  });
}
