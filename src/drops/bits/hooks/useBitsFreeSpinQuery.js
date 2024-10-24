import useFarmerApi from "@/hooks/useFarmerApi";
import { useIsMutating, useQuery } from "@tanstack/react-query";

import useBitsToken from "./useBitsToken";

export default function useBitsFreeSpinQuery() {
  const api = useFarmerApi();
  const token = useBitsToken();
  const isMutating = useIsMutating({ mutationKey: ["bits"] });

  return useQuery({
    refetchInterval: isMutating < 1 ? 10000 : false,
    queryKey: ["bits", "spin", "free"],
    queryFn: ({ signal }) =>
      api
        .get(
          `https://api-bits.apps-tonbox.me/api/v1/free_spin/time?access_token=${token}`,
          {
            signal,
          }
        )
        .then((res) => res.data),
  });
}
