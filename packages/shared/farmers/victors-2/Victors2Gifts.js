import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import { TOKEN_SYMBOL } from "./constants.js";

/** The grants a wallet carries over from the old token: the thank-you gift and the loss voucher */
export default class Victors2Gifts extends FarmerModule {
  /** Collect what is ready, and report a voucher that still needs a choice */
  async collect() {
    await this.claimThanksGift();
    await this.claimVoucherCashout();
    this.logUnusedVoucher();
  }

  /** Collect the thank-you gift, which needs a proven wallet and the pass */
  async claimThanksGift() {
    const user = this.ctx.state.user();
    const gift = user["thanksGift"];

    if (!gift || gift["claimed"] || gift["claimedElsewhere"]) return;

    const amount = `${formatAmount(gift["amount"])} ${TOKEN_SYMBOL}`;

    if (user["walletOwned"] === false) {
      this.logger.warn(`A ${amount} gift waits for a proven wallet.`);
      return;
    }

    if (!this.ctx.state.isPassActive()) {
      this.logger.warn(`A ${amount} gift waits for the Mine Pass.`);
      return;
    }

    const result = await this.ctx.api.claimThanksGift();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to collect the gift:", result["error"]);
      return;
    }

    this.ctx.state.apply(result);
    this.logger.success(
      `Collected the ${formatAmount(result["paid"] ?? gift["amount"])} ${TOKEN_SYMBOL} gift.`,
    );
  }

  /** Claim the second part of a cashed-out voucher once it unlocks */
  async claimVoucherCashout() {
    const cashout = this.ctx.state.user()["lossVoucher"]?.["cashout"];

    if (!cashout?.["laterReady"] || !cashout["mine"]) return;

    const result = await this.ctx.api.claimVoucherCashout();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to claim the voucher:", result["error"]);
      return;
    }

    this.ctx.state.apply(result);
    this.logger.success(
      `Claimed ${formatAmount(result["paid"] ?? cashout["later"])} ${TOKEN_SYMBOL} from the loss voucher.`,
    );
  }

  /** Report a claimed voucher nobody has chosen a use for, since holding and cashing out differ */
  logUnusedVoucher() {
    const voucher = this.ctx.state.user()["lossVoucher"];

    if (!voucher || voucher["use"]) return;

    this.logger.warn(
      `A ${formatAmount(voucher["amount"])} ${TOKEN_SYMBOL} loss voucher is unused, choose Hold or Cash out in the app.`,
    );
  }
}
