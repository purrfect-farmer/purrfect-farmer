import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useCEXTasksQuery() {
  const { api, payload } = useFarmerContext();
  return useQuery({
    queryKey: ["cex", "tasks"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://app.cexptap.com/api/v2/getUserTasks",
          {
            ...payload,
            data: {},
          },
          {
            signal,
          }
        )
        .then((res) => res.data),
  });
}