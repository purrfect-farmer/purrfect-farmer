import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { createDevice } from "../../lib/device/createDevice.js";

/** The phone the account runs on and the browser signals it reports */
export default class DiggoBrowser extends FarmerModule {
  /** Whether the sign-in signals were sent this session */
  signalsSent = false;

  /** The account's phone, the same on every run, which the browser signals describe */
  getDevice() {
    return (this.device ||= createDevice(
      this.core.userId(),
      this.core.userAgent,
    ));
  }

  /** Send the page's sign-in signals once per session, never failing the run */
  async reportSignals() {
    if (this.signalsSent) return;
    this.signalsSent = true;

    const { profile } = this.getDevice();

    /* Browsers report deviceMemory capped at 8 */
    await this.ctx.api
      .sendBrowserSignals({
        screen: [profile.screen.w, profile.screen.h, profile.screen.depth],
        cores: profile.cpu,
        memory: Math.min(8, Number(profile.ram) || 4),
        touch: profile.touch,
        webdriver: false,
      })
      .catch(() => null);
  }
}
