import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useTruecoinPartnerTasksQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["truecoin", "partner", "tasks"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.true.world/api/partners/getPartnersGroupsOfTasks", {
          signal,
        })
        .then((res) => res.data),
  });
}
