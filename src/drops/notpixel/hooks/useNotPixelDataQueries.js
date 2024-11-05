import useFarmerContext from "@/hooks/useFarmerContext";
import { useCallback } from "react";
import { useQueries } from "@tanstack/react-query";

export default function useNotPixelDataQueries() {
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
        queryKey: ["notpixel", "user"],
        queryFn: ({ signal }) =>
          api
            .get("https://notpx.app/api/v1/users/me", {
              signal,
            })
            .then((res) => res.data),
      },
      {
        queryKey: ["notpixel", "mining", "status"],
        queryFn: ({ signal }) =>
          api
            .get("https://notpx.app/api/v1/mining/status", {
              signal,
            })
            .then((res) => res.data),
      },
    ],
  });
}
