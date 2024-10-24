import useFarmerContext from "@/hooks/useFarmerContext";
import { useCallback } from "react";
import { useIsMutating, useQueries } from "@tanstack/react-query";

import { getHrumHeaders } from "../lib/utils";

export default function useHrumDataQueries() {
  const { api, telegramWebApp } = useFarmerContext();
  const isMutating = useIsMutating({ mutationKey: ["hrum"] });

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
        queryKey: ["hrum", "all"],
        queryFn: ({ signal }) => {
          const body = {
            data: {},
          };

          return api
            .post("https://api.hrum.me/user/data/all", body, {
              signal,
              headers: getHrumHeaders(
                body,
                telegramWebApp.initDataUnsafe["hash"]
              ),
            })
            .then((res) => res.data.data);
        },
      },
      {
        refetchInterval: isMutating < 1 ? 10_000 : false,
        queryKey: ["hrum", "after"],
        queryFn: ({ signal }) => {
          const body = {
            data: { lang: "en" },
          };

          return api
            .post("https://api.hrum.me/user/data/after", body, {
              signal,
              headers: getHrumHeaders(
                body,
                telegramWebApp.initDataUnsafe["hash"]
              ),
            })
            .then((res) => res.data.data);
        },
      },
    ],
  });
}
