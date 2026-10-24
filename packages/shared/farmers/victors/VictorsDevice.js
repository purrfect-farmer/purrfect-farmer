import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { createDevice } from "../../lib/device/createDevice.js";

/** The phone the account runs on, as the page fingerprints it */
export default class VictorsDevice extends FarmerModule {
  /** The account's phone, the same on every run */
  get() {
    return (this.device ||= createDevice(
      this.core.userId(),
      this.core.userAgent,
      { prefix: "victors-device" },
    ));
  }
}
