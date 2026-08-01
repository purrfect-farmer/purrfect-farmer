import BaseSwapper from "@purrfect/shared/lib/auto/BaseSwapper.js";
import useAuto from "./useAuto";
import { useQuery } from "@tanstack/react-query";

/**
 * Live STON.fi quote for the swap form.
 *
 * Quoting never touches the master wallet - it only needs the drop's jetton
 * address - so this runs without decrypting anything.
 */
export default function useAutoSwapQuoteQuery({ direction, amount, slippage }) {
  const { config, enableRequests } = useAuto();
  const hasAmount = Number(amount) > 0;

  return useQuery({
    queryKey: [config.id, "swap-quote", direction, amount, slippage],
    queryFn: () =>
      new BaseSwapper(null, config.jettonAddress, {
        token: config.token,
        referralAddress: import.meta.env.VITE_APP_DONATE_TON_ADDRESS,
      }).quote({ direction, amount, slippage }),
    enabled: enableRequests && hasAmount,
    /* Rates move, so refresh while the form sits open, but do not retry a
     * pair STON.fi simply cannot trade. */
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: (failureCount, error) => !error?.unavailable && failureCount < 2,
  });
}
