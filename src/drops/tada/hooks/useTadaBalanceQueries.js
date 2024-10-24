import useFarmerApi from "@/hooks/useFarmerApi";
import { useCallback } from "react";
import { useIsMutating, useQueries } from "@tanstack/react-query";

export default function useTadaBalanceQueries() {
  const api = useFarmerApi();
  const isMutating = useIsMutating({ mutationKey: ["tada"] });

  const combine = useCallback((results) => {
    return {
      query: results,
      data: results.map((result) => result.data),
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      isSuccess: results.every((result) => result.isSuccess),
    };
  }, []);

  return useQueries({
    combine,
    queries: [
      {
        refetchInterval: isMutating < 1 ? 10_000 : false,
        queryKey: ["tada", "point-passive"],
        queryFn: ({ signal }) => {
          return api
            .get(
              "https://backend.clutchwalletserver.xyz/activity/v1/mission-point?missionPointId=REFERRAL_POINT_PASSIVE",
              {
                signal,
              }
            )
            .then((res) => res.data);
        },
      },
      {
        refetchInterval: isMutating < 1 ? 10_000 : false,
        queryKey: ["tada", "point-active"],
        queryFn: ({ signal }) => {
          return api
            .get(
              "https://backend.clutchwalletserver.xyz/activity/v1/mission-point?missionPointId=REFERRAL_POINT_ACTIVE",
              {
                signal,
              }
            )
            .then((res) => res.data);
        },
      },
    ],
  });
}
