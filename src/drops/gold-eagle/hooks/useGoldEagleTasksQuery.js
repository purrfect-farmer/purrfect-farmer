import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useGoldEagleTasksQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["gold-eagle", "tasks"],
    queryFn: ({ signal }) =>
      api
        .get("https://gold-eagle-api.fly.dev/task/my/available", {
          signal,
        })
        .then((res) => res.data),
  });
}
