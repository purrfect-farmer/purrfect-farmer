import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { CAPTCHA_SLIDE, SLIDER_CAPTCHA } from "./constants.js";

/** A whole number from `min` to `max` */
function randomBetween(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/** The slider captcha the drop puts before registering and collecting */
export default class LootVaultCaptcha extends FarmerModule {
  /** Slide a fresh captcha the way a finger does, for its single-use token */
  async obtainToken() {
    const captcha = await this.ctx.api.fetchCaptcha();

    if (captcha?.["type"] !== SLIDER_CAPTCHA) {
      throw new Error(`Unknown captcha type: ${captcha?.["type"]}`);
    }

    const result = await this.ctx.api.verifyCaptcha({
      id: captcha["id"],
      duration: randomBetween(
        CAPTCHA_SLIDE.MIN_DURATION,
        CAPTCHA_SLIDE.MAX_DURATION,
      ),
      moves: randomBetween(CAPTCHA_SLIDE.MIN_MOVES, CAPTCHA_SLIDE.MAX_MOVES),
      slide: true,
    });

    if (!result?.["token"]) {
      throw new Error("The captcha returned no token");
    }

    return result["token"];
  }
}
