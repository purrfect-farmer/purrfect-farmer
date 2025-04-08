import useFarmerContext from "@/hooks/useFarmerContext";
import { useCallback } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

export const TASK_CATEGORIES = {
  project: "project",
  partners: "parthers",
  sponsors: "sponsors",
  loans: "loans",
};

export function useSpaceAdventureAllTasksQueries() {
  const { api } = useFarmerContext();
  const combine = useCallback((results) => {
    return {
      query: results,
      data: results.map((result) => result.data),
      isLoading: results.some((result) => result.isLoading),
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      isSuccess: results.every((result) => result.isSuccess),
    };
  }, []);

  return useQueries({
    combine,
    queries: Object.values(TASK_CATEGORIES).map((category) => ({
      queryKey: ["space-adventure", "tasks", category],
      queryFn: ({ signal }) =>
        api
          .get(
            "https://space-adventure.online/api/tasks/get?category=" + category,
            {
              signal,
            }
          )
          .then((res) => res.data),
    })),
  });
}

export default function useSpaceAdventureTasksQuery(category) {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["space-adventure", "tasks", category],
    queryFn: ({ signal }) =>
      api
        .get(
          "https://space-adventure.online/api/tasks/get?category=" + category,
          {
            signal,
          }
        )
        .then((res) => res.data),
  });
}
