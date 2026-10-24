import FarmerModule from "../../lib/farmer/FarmerModule.js";
import {
  INIT_DATA_MAX_AGE_SECONDS,
  NO_APP_SESSION_CODE,
  SESSION_STALE_CODE,
  SLIDER_CAPTCHA_ATTEMPTS,
  TURNSTILE_PAGE_URL,
  TURNSTILE_SITE_KEY,
  WITHDRAWAL_COOLDOWN_HOURS,
} from "./constants.js";
import Decimal from "decimal.js";
import { formatAmount, logCurrentUser } from "../../lib/farmer/format.js";
import { buildSliderTrace, findSliderX } from "../../lib/sliderCaptcha.js";

/** Withdrawals, their captchas and the pending queue */
export default class MRGWithdrawal extends FarmerModule {
  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /* --------------------------------------------------------------------- */

  /** The account's withdrawals, as its transaction history lists them */
  getWithdrawals() {
    const transactions = this.ctx.state.data?.["transactions"] || [];

    return transactions.filter((transaction) =>
      String(transaction["type"] || "")
        .toLowerCase()
        .includes("withdraw"),
    );
  }

  /** The payouts the drop has not settled yet */
  getPendingWithdrawals() {
    return this.ctx.withdrawals.pendingOf(this.getWithdrawals());
  }

  /** How long until the drop takes another request, counted from the last completed payout */
  getWithdrawalCooldownMs() {
    const lastCompletedAt = this.getWithdrawals()
      .filter(
        (transaction) =>
          transaction["status"] === "Completed" && transaction["updatedAt"],
      )
      .map((transaction) => new Date(transaction["updatedAt"]).getTime())
      .reduce((latest, time) => Math.max(latest, time), 0);

    if (!lastCompletedAt) return 0;

    return Math.max(
      0,
      lastCompletedAt + WITHDRAWAL_COOLDOWN_HOURS * 60 * 60 * 1000 - Date.now(),
    );
  }

  /** Format a cooldown as hours and minutes */
  formatCooldown(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    return `${hours}h ${minutes}m`;
  }

  /** How old the signed `initData` is, in seconds, which the backend caps for withdrawals */
  getInitDataAgeSeconds() {
    const authDate = Number(
      new URLSearchParams(this.core.initData() || "").get("auth_date"),
    );

    return authDate ? Date.now() / 1000 - authDate : 0;
  }

  /** A Turnstile token for the withdrawal, rendered with the `withdraw` action, or none, which the page also sends when the widget fails */
  async solveWithdrawalTurnstile() {
    if (!this.core.captcha.canSolveTurnstile()) return "";

    try {
      return await this.core.captcha.solveTurnstile({
        siteKey: TURNSTILE_SITE_KEY,
        pageUrl: TURNSTILE_PAGE_URL,
        action: "withdraw",
      });
    } catch (error) {
      this.logger.warn("Withdrawal Turnstile failed:", error.message);
      return "";
    }
  }

  /** Place withdrawal */
  async place({ max, difference }) {
    const { flow } = this.ctx;

    await this.ctx.state.ensureLoaded();

    const user = this.ctx.state.user();
    const destinationAddress = user["tonWalletAddress"];

    if (!destinationAddress) {
      return flow.skip("No wallet connected!");
    }

    if (!this.ctx.account.isAccountVerified(user)) {
      return flow.skip("Account is not verified on-chain!", {
        log: "warn",
      });
    }

    if (this.getInitDataAgeSeconds() > INIT_DATA_MAX_AGE_SECONDS) {
      return flow.skip("Session is too old, reopen the app!", {
        log: "warn",
      });
    }

    if (this.getPendingWithdrawals().length > 0) {
      return flow.skip("A withdrawal is already pending!", {
        log: "warn",
      });
    }

    const cooldown = this.getWithdrawalCooldownMs();

    if (cooldown > 0) {
      return flow.skip(`Next withdrawal in ${this.formatCooldown(cooldown)}!`, {
        log: "warn",
      });
    }

    const balance = new Decimal(user["inAppBalance"] || 0);
    const minimum = flow.minimum();
    const lowBalance = flow.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    /** The NFTs the wallet holds decide both the ceiling and the fee */
    const discountPercent = await this.ctx.nft.readNftDiscountPercent();

    const amount = flow.pickAmount({
      balance,
      minimum,
      max,
      difference,
    });

    let result;

    try {
      await this.ctx.humanCheck.ensure();

      const captchaToken = await this.solveWithdrawalCaptcha();
      const turnstileToken = await this.solveWithdrawalTurnstile();
      const request = () =>
        this.ctx.api.requestWithdrawal(
          amount,
          destinationAddress,
          captchaToken,
          turnstileToken,
        );

      result = await request();

      /** The page signs in again once and resends when the backend lost the session */
      if (!result?.["success"] && result?.["code"] === NO_APP_SESSION_CODE) {
        await this.ctx.api.verifyAccount();
        result = await request();
      }
    } catch (error) {
      result = { success: false, error: error.message || "Unknown error" };
    }

    /** The page only reloads on a stale session, so a retry would be refused the same way */
    if (!result?.["success"] && result?.["code"] === SESSION_STALE_CODE) {
      return flow.skip("Session is stale, reopen the app!", {
        log: "warn",
      });
    }

    const status = Boolean(result?.["success"]);
    const message = result?.["error"] || result?.["message"] || "";

    if (status) {
      if (result["user"]) {
        this.ctx.state.setUser(result["user"]);
      }

      if (result["transaction"]) {
        this.ctx.state.data["transactions"] = [
          result["transaction"],
          ...(this.ctx.state.data["transactions"] || []),
        ];
      }

      this.logger.success(`Requested ${amount.toString()} MRG.`);
      this.logger.keyValue("Destination", destinationAddress);
      this.logger.keyValue(
        "To be received",
        Decimal.max(
          amount.minus(this.ctx.nft.getWithdrawalFee(discountPercent)),
          0,
        ).toString(),
      );

      await flow.notify([
        ["Initial Balance", balance.toString()],
        ["Requested", amount.toString()],
        ["Destination", `<code>${destinationAddress}</code>`],
      ]);
    } else {
      this.logger.error("Failed to request withdrawal:", message);
    }

    return {
      status,
      message,
      result,
      skipped: false,
      amount: amount.toString(),
    };
  }

  /** Pass the withdrawal slider, fetching a fresh puzzle after each refusal */
  async solveWithdrawalCaptcha() {
    let lastError = "The slider captcha was refused";

    for (let attempt = 1; attempt <= SLIDER_CAPTCHA_ATTEMPTS; attempt++) {
      if (this.signal.aborted) break;

      const challenge = await this.ctx.api.createCaptcha();

      if (!challenge?.["success"] || !challenge["captchaId"]) {
        throw new Error(challenge?.["error"] || "Failed to get a captcha");
      }

      const sliderX = await this.solveSliderCaptcha(challenge);

      /** The page posts the drag only after the pointer is released */
      const trace = buildSliderTrace(sliderX);

      await this.utils.delayForSeconds(trace.at(-1)[0] / 1000, {
        signal: this.signal,
      });

      const result = await this.ctx.api.verifyCaptcha(
        challenge["captchaId"],
        sliderX,
        trace,
      );

      if (result?.["success"] && result["captchaToken"]) {
        return result["captchaToken"];
      }

      lastError = result?.["error"] || lastError;
      this.logger.warn(`Captcha attempt ${attempt} refused: ${lastError}`);
    }

    throw new Error(lastError);
  }

  /** Where the slider piece fits, as the `sliderX` the drop expects (0 to 263 on a 320px canvas) */
  async solveSliderCaptcha(challenge) {
    const sliderX = findSliderX(challenge);

    this.logger.info("Slider captcha answer:", sliderX);

    return sliderX;
  }

  /** Log the payouts the drop has not settled yet */
  async logStatus() {
    await this.ctx.state.ensureLoaded();

    const pending = this.getPendingWithdrawals();
    const discountPercent = await this.ctx.nft.readNftDiscountPercent();
    const verified = this.ctx.account.isAccountVerified(this.ctx.state.user());

    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue(
      "Balance",
      formatAmount(this.ctx.state.user()["inAppBalance"]),
    );
    this.logger.keyValue("Minimum", this.ctx.flow.minimum());
    this.logger.keyValue("Verified", verified ? "Yes" : "No", {
      valueStyle: verified
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });

    const cooldown = this.getWithdrawalCooldownMs();

    this.logger.keyValue(
      "Next Withdrawal",
      cooldown > 0 ? `In ${this.formatCooldown(cooldown)}` : "Now",
    );
    this.logger.keyValue(
      "Fee",
      formatAmount(this.ctx.nft.getWithdrawalFee(discountPercent)),
      {
        valueStyle: discountPercent
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );

    if (discountPercent) {
      this.logger.keyValue("NFT Discount", `${discountPercent}%`, {
        valueStyle: this.logger.c.greenBright,
      });
    }
    this.logger.keyValue("Pending Withdrawals", pending.length, {
      valueStyle: pending.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });

    if (!pending.length) {
      this.logger.success("No withdrawal is awaiting processing.");
      return { status: true, pending };
    }

    for (const transaction of pending) {
      this.logger.newline();
      this.logger.keyValue("Amount", transaction["amount"]);
      this.logger.keyValue("Status", transaction["status"]);
      this.logger.keyValue("Requested", transaction["timestamp"]);
    }

    return { status: true, pending };
  }
}
