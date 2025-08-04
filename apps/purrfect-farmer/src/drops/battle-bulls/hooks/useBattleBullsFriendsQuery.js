import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useBattleBullsFriendsQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["battle-bulls", "friends"],
    queryFn: ({ signal }) =>
      api
        .get(
          "https://api.battle-games.com:8443/api/api/v1/user/friends?page=0&size=10",
          {
            signal,
          }
        )
        .then((res) => res.data.data),
  });
}
