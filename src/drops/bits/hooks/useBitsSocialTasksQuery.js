import useFarmerApi from "@/hooks/useFarmerApi";
import { useIsMutating, useQuery } from "@tanstack/react-query";

import useBitsToken from "./useBitsToken";

export default function useBitsSocialTasksQuery() {
  const api = useFarmerApi();
  const token = useBitsToken();
  const isMutating = useIsMutating({ mutationKey: ["bits"] });

  return useQuery({
    refetchInterval: isMutating < 1 ? 10000 : false,
    queryKey: ["bits", "social-tasks", "list"],
    queryFn: ({ signal }) =>
      api
        .get(
          `https://api-bits.apps-tonbox.me/api/v1/socialtasks?access_token=${token}`,
          {
            signal,
          }
        )
        .then((res) => res.data),
  });
}
