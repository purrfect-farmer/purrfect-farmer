import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { createVictorsDevice } from "../../lib/games/victorsDevice.js";

/** The phone the account runs on, as the page fingerprints it */
export default class VictorsDevice extends FarmerModule {
  /** The account's phone, the same on every run */
  get() {
    return (this.device ||= createVictorsDevice(
      this.core.userId(),
      this.core.userAgent,
    ));
  }
}
