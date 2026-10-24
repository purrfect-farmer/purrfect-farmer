import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { getAccountDevice } from "../../lib/device/createDevice.js";

/** The phone the account runs on, as the page fingerprints it */
export default class VictorsDevice extends FarmerModule {
  /** The account's phone, the same on every run */
  get() {
    return getAccountDevice(this.core);
  }
}
