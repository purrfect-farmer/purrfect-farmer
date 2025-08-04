import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useCEXTasksConfigQuery() {
  const { api, payload } = useFarmerContext();
  return useQuery({
    queryKey: ["cex", "tasks-config"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://app.cexptap.com/api/v2/getTasksConfig",
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
