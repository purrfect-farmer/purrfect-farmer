import { getSwapAsset } from "@purrfect/shared/lib/auto/swap.js";
import useAuto from "./useAuto";
import { useQuery } from "@tanstack/react-query";

/**
 * Looks the drop's jetton up on STON.fi.
 *
 * Doubles as the availability check for the swap tab: not every drop's token
 * is listed there, and a token STON.fi has never heard of cannot be swapped.
 */
export default function useAutoSwapAssetQuery() {
  const { config, enableRequests } = useAuto();

  return useQuery({
    queryKey: [config.id, "swap-asset"],
    queryFn: () => getSwapAsset(config.jettonAddress),
    enabled: enableRequests,
    staleTime: Infinity,
    retry: (failureCount, error) => !error?.unavailable && failureCount < 2,
  });
}
