import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMidasReferredUsersQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["midas", "referred", "users"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-tg-app.midas.app/api/referral/referred-users", {
          signal,
        })
        .then((res) => res.data),
  });
}
