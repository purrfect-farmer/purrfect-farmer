import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useBattleBullsUserQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["battle-bulls", "user"],
    queryFn: ({ signal }) =>
      api
        .post("https://api.battle-games.com:8443/api/api/v1/user/sync", null, {
          signal,
        })
        .then((res) => res.data.data),
  });
}
