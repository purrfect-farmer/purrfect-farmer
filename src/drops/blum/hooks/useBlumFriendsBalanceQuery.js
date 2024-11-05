import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useBlumFriendsBalanceQuery() {
  const { api } = useFarmerContext();

  return useQuery({
    queryKey: ["blum", "friends", "balance"],
    queryFn: ({ signal }) =>
      api
        .get("https://user-domain.blum.codes/api/v1/friends/balance", {
          signal,
        })
        .then((res) => res.data),
  });
}
