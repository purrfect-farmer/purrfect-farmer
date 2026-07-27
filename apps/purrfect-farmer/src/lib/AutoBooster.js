import BaseBooster from "@purrfect/shared/lib/auto/BaseBooster.js";
import { fromNano } from "@ton/core";
import toast from "react-hot-toast";

/**
 * Booster with progress toasts, for operations run locally in the browser.
 * The token symbol shown in the toasts comes from the drop's descriptor.
 */
export default class AutoBooster extends BaseBooster {
  constructor(master, account, prepared, { token = "" } = {}) {
    super(master, account, prepared);
    this.token = token;
  }

  sendJettonFromMaster(amount) {
    return toast.promise(super.sendJettonFromMaster(amount), {
      loading: `Sending ${amount} ${this.token} from master`,
      success: `Sent ${amount} ${this.token} from master`,
    });
  }

  sendGasFromMaster(amount) {
    return toast.promise(super.sendGasFromMaster(amount), {
      loading: `Sending ${fromNano(amount)} TON from master`,
      success: `Sent ${fromNano(amount)} TON from master`,
    });
  }

  returnJettonToMaster(amount) {
    return toast.promise(super.returnJettonToMaster(amount), {
      loading: `Returning ${amount} ${this.token} to master`,
      success: `Returned ${amount} ${this.token} to master`,
    });
  }

  returnTonToMaster() {
    return toast.promise(super.returnTonToMaster(), {
      loading: "Returning TON to master",
      success: "TON returned to master",
    });
  }
}
