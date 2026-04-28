import BaseATFAutoBooster from "@purrfect/shared/lib/BaseATFAutoBooster.js";
import { fromNano } from "@ton/core";
import toast from "react-hot-toast";

export default class ATFAutoBooster extends BaseATFAutoBooster {
  sendJettonFromMaster(amount) {
    return toast.promise(super.sendJettonFromMaster(amount), {
      loading: `Sending ${amount} ATF from master`,
      success: `Sent ${amount} ATF from master`,
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
      loading: `Returning ${amount} ATF to master`,
      success: `Returned ${amount} ATF to master`,
    });
  }

  returnTonToMaster() {
    return toast.promise(super.returnTonToMaster(), {
      loading: "Returning TON to master",
      success: "TON returned to master",
    });
  }
}
