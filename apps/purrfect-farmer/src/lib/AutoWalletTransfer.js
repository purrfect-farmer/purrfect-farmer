import BaseWalletTransfer from "@purrfect/shared/lib/auto/BaseWalletTransfer.js";
import { fromNano } from "@ton/core";
import toast from "react-hot-toast";

/**
 * Wallet transfer with progress toasts, for transfers run locally in the
 * browser. The token symbol shown in the toasts comes from the drop's
 * descriptor.
 */
export default class AutoWalletTransfer extends BaseWalletTransfer {
  constructor(master, address, jettonAddress, { token = "" } = {}) {
    super(master, address, jettonAddress);
    this.token = token;
  }

  sendJettonToAddress(amount) {
    return toast.promise(super.sendJettonToAddress(amount), {
      loading: `Sending ${amount} ${this.token}`,
      success: `Sent ${amount} ${this.token}`,
    });
  }

  sendTonToAddress(amount) {
    return toast.promise(super.sendTonToAddress(amount), {
      loading: `Sending ${fromNano(amount)} TON`,
      success: `Sent ${fromNano(amount)} TON`,
    });
  }
}
