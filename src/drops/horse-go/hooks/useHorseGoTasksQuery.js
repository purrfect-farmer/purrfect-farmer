import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useHorseGoTasksQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["horse-go", "tasks"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.horsego.vip/user_api/taskList", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
