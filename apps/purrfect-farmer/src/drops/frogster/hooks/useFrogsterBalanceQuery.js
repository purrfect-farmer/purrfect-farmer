import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useFrogsterBalanceQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["frogster", "balance"],
    queryFn: ({ signal }) =>
      api
        .get("https://frogster.app/api/wallets/balance", {
          signal,
        })
        .then((res) => res.data),
  });
}
