import { getBalances } from "@/lib/atf-auto";
import useATFAuto from "./useATFAuto";
import { useQuery } from "@tanstack/react-query";

export default function useATFBalancesQuery(address) {
  const { enableRequests } = useATFAuto();
  return useQuery({
    queryKey: ["atf-balances", address],
    queryFn: () => getBalances(address),
    refetchInterval: 60_000,
    enabled: enableRequests && Boolean(address),
  });
}
