import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import {
  AD_CHECK_ATTEMPTS,
  AD_CHECK_SECONDS,
  AD_KIND,
  AD_STATE,
  TOKEN_SYMBOL,
} from "./constants.js";

/** The ad rewards: an AdsGram block is watched, AdsGram reports it to the drop, then the reward is claimed */
export default class Victors2Ads extends FarmerModule {
  /** The labels each ad reward is logged under */
  static LABELS = Object.freeze({
    [AD_KIND.REWARD]: "Video ad",
    [AD_KIND.TASK]: "Ad task",
  });

  /** Where an ad reward stands, read the way the page reads it */
  getState(ad) {
    if (ad["state"]) return ad["state"];
    if (ad["available"]) return AD_STATE.OPEN;

    return ad["nextAt"] ? AD_STATE.COOLDOWN : AD_STATE.PAUSED;
  }

  /** Watch and claim every ad reward that is open */
  async completeAds() {
    for (const kind of Object.values(AD_KIND)) {
      if (this.signal.aborted) break;

      try {
        await this.completeAd(kind);
      } catch (error) {
        this.logger.warn(`${Victors2Ads.LABELS[kind]} failed:`, error.message);
      }
    }
  }

  /** Take one ad reward from open to claimed */
  async completeAd(kind) {
    const label = Victors2Ads.LABELS[kind];
    let ad = await this.ctx.api.fetchAd(kind);

    if (this.getState(ad) === AD_STATE.OPEN) {
      await this.ctx.ads.adsgram.watch(ad["block"]);
      ad = await this.waitUntilReported(kind);
    }

    const state = this.getState(ad);

    if (state === AD_STATE.PENDING) {
      return this.claim(kind, ad);
    }

    if (state === AD_STATE.COOLDOWN) {
      this.logger.info(
        `${label} is on cooldown until ${new Date(ad["nextAt"]).toLocaleString()}.`,
      );
      return;
    }

    this.logger.info(
      state === AD_STATE.OPEN
        ? `${label} was watched but not reported yet.`
        : `${label} is not available.`,
    );
  }

  /** Re-read an ad reward until AdsGram's report moves it on from open */
  async waitUntilReported(kind) {
    let ad = null;

    for (let attempt = 0; attempt < AD_CHECK_ATTEMPTS; attempt++) {
      await this.utils.delayForSeconds(AD_CHECK_SECONDS, {
        signal: this.signal,
      });

      ad = await this.ctx.api.fetchAd(kind).catch(() => ad);

      if (ad && this.getState(ad) !== AD_STATE.OPEN) break;
    }

    return ad || {};
  }

  /** Claim a watched ad's reward */
  async claim(kind, ad) {
    const label = Victors2Ads.LABELS[kind];
    const result = await this.ctx.api.claimAd(kind);

    if (result?.["success"] === false) {
      this.logger.warn(`Failed to claim the ${label}:`, result["error"]);
      return;
    }

    this.logger.success(
      `${label} claimed for ${formatAmount(result["reward"] ?? ad["reward"])} ${TOKEN_SYMBOL}.`,
    );

    /** The claim answers with the ad's new state only, so the balance is re-read */
    await this.ctx.state.load();
  }
}
