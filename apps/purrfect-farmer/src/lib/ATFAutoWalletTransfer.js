import BaseATFAutoWalletTransfer from "@purrfect/shared/lib/BaseATFAutoWalletTransfer.js";
import { fromNano } from "@ton/core";
import toast from "react-hot-toast";

export default class ATFAutoWalletTransfer extends BaseATFAutoWalletTransfer {
  sendJettonToAddress(amount) {
    return toast.promise(super.sendJettonToAddress(amount), {
      loading: `Sending ${amount} ATF`,
      success: `Sent ${amount} ATF`,
    });
  }

  sendTonToAddress(amount) {
    return toast.promise(super.sendTonToAddress(amount), {
      loading: `Sending ${fromNano(amount)} TON`,
      success: `Sent ${fromNano(amount)} TON`,
    });
  }
}
