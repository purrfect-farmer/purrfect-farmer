import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useRektReferredUsersQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["rekt", "referred-users", "count"],
    queryFn: ({ signal }) =>
      api
        .get("https://rekt-mini-app.vercel.app/api/user/referred-users-count", {
          signal,
        })
        .then((res) => res.data),
  });
}
