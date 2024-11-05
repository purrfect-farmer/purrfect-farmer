import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";
import useBitsToken from "./useBitsToken";

export default function useBitsSocialTasksQuery() {
  const api = useFarmerApi();
  const token = useBitsToken();

  return useQuery({
    queryKey: ["bits", "social-tasks", "list"],
    queryFn: ({ signal }) =>
      api
        .get(
          `https://api-bits.apps-tonbox.me/api/v1/socialtasks?access_token=${token}`,
          {
            signal,
          }
        )
        .then((res) => res.data),
  });
}
