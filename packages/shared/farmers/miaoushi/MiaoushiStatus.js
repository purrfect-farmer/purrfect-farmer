import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { DRAW_STATES, LINK_STATES, LOOKUP_URL } from "./constants.js";

/** The entry as the website reports it for the derived wallet */
export default class MiaoushiStatus extends FarmerModule {
  /** The last lookup result */
  data = null;

  /** Read the entry for the derived wallet */
  async load() {
    const address = await this.ctx.identity.address();
    const { data } = await this.api.get(LOOKUP_URL, {
      params: { address },
      signal: this.signal,
    });

    this.data = data;
    return data;
  }

  /** Whether the wallet has a submitted entry */
  isEntered() {
    return Boolean(this.data?.found && this.data?.entry);
  }

  /** Log the entry and warn about anything that can lose it */
  logInfo() {
    const data = this.data;

    if (!this.isEntered()) {
      this.logger.warn("No entry yet");
      return;
    }

    this.logger.keyValue("Reward", `${data.reward} MIAO`);
    this.logger.keyValue("Draw", data.draw);
    this.logger.keyValue("Quote", data.x?.linkStatus);
    this.logger.keyValue("Referrals", data.referrals);
    this.logger.keyValue("Commission", `${data.commission} MIAO`);
    this.logger.keyValue("Rank", data.rank ?? "-");

    if (data.draw === DRAW_STATES.CANCELLED) {
      this.logger.error(`Entry cancelled: ${data.cancelReason}`);
    } else if (data.draw === DRAW_STATES.WON) {
      this.logger.success("Won the draw, MIAO is sent to the wallet");
    }

    if (data.x?.linkStatus === LINK_STATES.FAIL) {
      this.logger.warn("The quote link failed its check");
    }
  }
}
