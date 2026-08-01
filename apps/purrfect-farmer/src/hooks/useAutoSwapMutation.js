import AutoSwapper from "@/lib/AutoSwapper";
import useAuto from "./useAuto";
import useAutoMaster from "./useAutoMaster";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Executes a swap from the master wallet.
 *
 * Unlike the quote, this needs the decrypted master because the swap message
 * is signed locally - the same path `AutoTransferDialog` uses.
 */
export default function useAutoSwapMutation() {
  const { config, master } = useAuto();
  const { buildMasterData } = useAutoMaster();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [config.id, "swap", master.address],
    onError: (error) => {
      console.log("Error while swapping from master wallet", error);
    },
    onSuccess: () => {
      /* Balances shift once the pool fills the swap, so drop the cached
       * figures the dashboard cards are showing. */
      queryClient.invalidateQueries({ queryKey: [config.id, "balances"] });
    },
    mutationFn: async ({ direction, amount, slippage }) => {
      /** Decrypt master */
      console.log("Decrypting master wallet....");
      const masterData = await buildMasterData();
      console.log("Successfully decrypted master wallet!");

      /** Create swapper instance */
      const swapper = new AutoSwapper(masterData, config.jettonAddress, {
        token: config.token,
        referralAddress: import.meta.env.VITE_APP_DONATE_TON_ADDRESS,
      });

      /** Execute the swap */
      return swapper.swap({ direction, amount, slippage });
    },
  });
}
