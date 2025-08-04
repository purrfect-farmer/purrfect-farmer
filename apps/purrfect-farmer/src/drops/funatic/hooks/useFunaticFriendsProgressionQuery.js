import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useFunaticFriendsProgressionQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["funatic", "friends", "progression"],
    queryFn: ({ signal }) =>
      api
        .get(
          "https://api2.funtico.com/api/lucky-funatic/user/friends-quest-progression",
          {
            signal,
          }
        )
        .then((res) => res.data.data),
  });
}
