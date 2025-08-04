import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMidasTasksQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["midas", "tasks"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-tg-app.midas.app/api/tasks/available", {
          signal,
        })
        .then((res) => res.data),
  });
}
