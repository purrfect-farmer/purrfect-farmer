import useFarmerContext from "@/hooks/useFarmerContext";
import { useCallback } from "react";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { getZooHeaders } from "../lib/utils";

export default function useZooDataQueries() {
  const { api, telegramWebApp } = useFarmerContext();
  const queryOptions = useMemo(
    () => ({
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    }),
    []
  );
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
        ...queryOptions,
        queryKey: ["zoo", "all"],
        queryFn: ({ signal }) => {
          const body = {
            data: {},
          };

          return api
            .post("https://api.zoo.team/user/data/all", body, {
              signal,
              headers: getZooHeaders(
                body,
                telegramWebApp.initDataUnsafe["hash"]
              ),
            })
            .then((res) => res.data.data);
        },
      },
      {
        ...queryOptions,
        queryKey: ["zoo", "after"],
        queryFn: ({ signal }) => {
          const body = {
            data: { lang: "en" },
          };

          return api
            .post("https://api.zoo.team/user/data/after", body, {
              signal,
              headers: getZooHeaders(
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
