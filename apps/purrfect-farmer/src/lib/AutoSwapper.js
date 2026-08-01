import BaseSwapper from "@purrfect/shared/lib/auto/BaseSwapper.js";
import { JETTON_TO_TON } from "@purrfect/shared/lib/auto/swap.js";
import toast from "react-hot-toast";

/**
 * Swapper with progress toasts, for swaps run locally in the browser. The
 * token symbol shown in the toasts comes from the drop's descriptor.
 */
export default class AutoSwapper extends BaseSwapper {
  swap({ direction, amount, slippage }) {
    const [from, to] =
      direction === JETTON_TO_TON
        ? [this.token, "TON"]
        : ["TON", this.token];

    return toast.promise(super.swap({ direction, amount, slippage }), {
      loading: `Swapping ${amount} ${from} for ${to}`,
      /* The seqno moved, so the message is sent - the pool fills it shortly
       * after, which is why this says "submitted" rather than "swapped". */
      success: (result) =>
        `Submitted swap of ${amount} ${from} for ~${result.expected.toFixed(4)} ${to}`,
    });
  }
}
