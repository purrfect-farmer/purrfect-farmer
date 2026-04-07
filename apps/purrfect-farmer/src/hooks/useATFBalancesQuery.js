import { getBalances } from "@/lib/atf-auto";
import { useQuery } from "@tanstack/react-query";

export default function useATFBalancesQuery(address) {
  return useQuery({
    queryKey: ["atf-balances", address],
    queryFn: () => getBalances(address),
    refetchInterval: 60_000,
    enabled: Boolean(address),
  });
}
