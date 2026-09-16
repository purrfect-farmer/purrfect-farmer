import { getSwapAsset } from "@purrfect/shared/lib/auto/swap.js";
import useAuto from "./useAuto";
import { useQuery } from "@tanstack/react-query";

/** Looks the drop's jetton up on STON.fi, which doubles as the swap tab's availability check */
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
