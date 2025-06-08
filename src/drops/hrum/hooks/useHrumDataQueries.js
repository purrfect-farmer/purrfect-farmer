import useFarmerContext from "@/hooks/useFarmerContext";
import { useCallback } from "react";
import { useQueries } from "@tanstack/react-query";

export default function useHrumDataQueries() {
  const { api } = useFarmerContext();

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
        queryKey: ["hrum", "all"],
        queryFn: ({ signal }) => {
          return api
            .post("https://api.hrum.me/user/data/all", {}, { signal })
            .then((res) => res.data.data);
        },
      },
      {
        queryKey: ["hrum", "after"],
        queryFn: ({ signal }) => {
          return api
            .post(
              "https://api.hrum.me/user/data/after",
              { lang: "en" },
              { signal }
            )
            .then((res) => res.data.data);
        },
      },
    ],
  });
}
