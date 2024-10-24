import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useAgent301TasksQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["agent301", "tasks"],
    queryFn: ({ signal }) =>
      api
        .post("https://api.agent301.org/getTasks", null, {
          signal,
        })
        .then((res) => res.data),
  });
}
