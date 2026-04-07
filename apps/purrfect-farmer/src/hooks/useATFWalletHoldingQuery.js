import { getWalletHolding } from "@/lib/atf-auto";
import { useQuery } from "@tanstack/react-query";

export default function useATFWalletHoldingQuery(url) {
  return useQuery({
    queryKey: ["atf-wallet-holding", url],
    queryFn: () => getWalletHolding(url),
    refetchInterval: 60_000,
    enabled: Boolean(url),
  });
}
