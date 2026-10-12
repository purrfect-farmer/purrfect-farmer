import AutoSwapper from "@/lib/AutoSwapper";
import useAuto from "./useAuto";
import useAutoMaster from "./useAutoMaster";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/** Executes a swap from the master or an account, decrypted because the message is signed locally */
export default function useAutoSwapMutation(sender) {
  const { config } = useAuto();
  const { buildWalletData } = useAutoMaster();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [config.id, "swap", sender?.address],
    onError: (error) => {
      console.log("Error while swapping", error);
    },
    onSuccess: () => {
      /* Balances shift once the pool fills the swap */
      queryClient.invalidateQueries({ queryKey: [config.id, "balances"] });
    },
    mutationFn: async ({ direction, amount, slippage }) => {
      /** Decrypt wallet */
      const wallet = await buildWalletData(sender);

      /** Create swapper instance */
      const swapper = new AutoSwapper(wallet, config.jettonAddress, {
        token: config.token,
        referralAddress: import.meta.env.VITE_APP_DONATE_TON_ADDRESS,
      });

      /** Execute the swap */
      return swapper.swap({ direction, amount, slippage });
    },
  });
}
