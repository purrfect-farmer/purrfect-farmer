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
import { buildSliderTrace, findSliderX } from "../../lib/sliderCaptcha.js";
import MRGTasks from "./MRGTasks.js";

/** Withdrawals, their captchas and the pending queue */
export default class MRGWithdrawal extends MRGTasks {
  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /* --------------------------------------------------------------------- */

  /** The account's withdrawals, as its transaction history lists them */
  getWithdrawals() {
    const transactions = this.account_data?.["transactions"] || [];

    return transactions.filter((transaction) =>
      String(transaction["type"] || "")
        .toLowerCase()
        .includes("withdraw"),
    );
  }

  /** The payouts the drop has not settled yet */
  getPendingWithdrawals() {
    return this.getWithdrawals().filter((transaction) => {
      const status = String(transaction["status"] || "").toLowerCase();

      return status === "pending" || status === "processing";
    });
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

  /** Whether the drop still owes this account a settlement */
  async hasPendingWithdrawal() {
    await this.ensureStateLoaded();

    return this.getPendingWithdrawals().length > 0;
  }

  /** The account's own withdrawal queue, which this drop never flags and never counts as approved */
  async getAutoWithdrawals() {
    await this.ensureStateLoaded();

    return { pending: this.getPendingWithdrawals(), flagged: [] };
  }

  /** How old the signed `initData` is, in seconds, which the backend caps for withdrawals */
  getInitDataAgeSeconds() {
    const authDate = Number(
      new URLSearchParams(this.getInitData() || "").get("auth_date"),
    );

    return authDate ? Date.now() / 1000 - authDate : 0;
  }

  /** A Turnstile token for the withdrawal, rendered with the `withdraw` action, or none, which the page also sends when the widget fails */
  async solveWithdrawalTurnstile() {
    if (!this.canSolveTurnstile()) return "";

    try {
      return await this.solveTurnstile({
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
  async placeWithdrawal({ max, difference }) {
    await this.ensureStateLoaded();

    const user = this.getAccountDetails();
    const destinationAddress = user["tonWalletAddress"];

    if (!destinationAddress) {
      return this.skipWithdrawal("No wallet connected!");
    }

    if (!this.isAccountVerified(user)) {
      return this.skipWithdrawal("Account is not verified on-chain!", {
        log: "warn",
      });
    }

    if (this.getInitDataAgeSeconds() > INIT_DATA_MAX_AGE_SECONDS) {
      return this.skipWithdrawal("Session is too old, reopen the app!", {
        log: "warn",
      });
    }

    if (this.getPendingWithdrawals().length > 0) {
      return this.skipWithdrawal("A withdrawal is already pending!", {
        log: "warn",
      });
    }

    const cooldown = this.getWithdrawalCooldownMs();

    if (cooldown > 0) {
      return this.skipWithdrawal(
        `Next withdrawal in ${this.formatCooldown(cooldown)}!`,
        { log: "warn" },
      );
    }

    const balance = new Decimal(user["inAppBalance"] || 0);
    const minimum = this.getMinimumWithdrawal();
    const lowBalance = this.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    /** The NFTs the wallet holds decide both the ceiling and the fee */
    const discountPercent = await this.readNftDiscountPercent();

    const amount = this.pickWithdrawalAmount({
      balance,
      minimum,
      max,
      difference,
    });

    let result;

    try {
      await this.ensureHumanCheck();

      const captchaToken = await this.solveWithdrawalCaptcha();
      const turnstileToken = await this.solveWithdrawalTurnstile();
      const request = () =>
        this.requestWithdrawal(
          amount,
          destinationAddress,
          captchaToken,
          turnstileToken,
        );

      result = await request();

      /** The page signs in again once and resends when the backend lost the session */
      if (!result?.["success"] && result?.["code"] === NO_APP_SESSION_CODE) {
        await this.verifyAccount();
        result = await request();
      }
    } catch (error) {
      result = { success: false, error: error.message || "Unknown error" };
    }

    /** The page only reloads on a stale session, so a retry would be refused the same way */
    if (!result?.["success"] && result?.["code"] === SESSION_STALE_CODE) {
      return this.skipWithdrawal("Session is stale, reopen the app!", {
        log: "warn",
      });
    }

    const status = Boolean(result?.["success"]);
    const message = result?.["error"] || result?.["message"] || "";

    if (status) {
      if (result["user"]) {
        this.account_data.user = result["user"];
      }

      if (result["transaction"]) {
        this.account_data["transactions"] = [
          result["transaction"],
          ...(this.account_data["transactions"] || []),
        ];
      }

      this.logger.success(`Requested ${amount.toString()} MRG.`);
      this.logger.keyValue("Destination", destinationAddress);
      this.logger.keyValue(
        "To be received",
        Decimal.max(
          amount.minus(this.getWithdrawalFee(discountPercent)),
          0,
        ).toString(),
      );

      await this.notifyWithdrawal([
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

      const challenge = await this.createCaptcha();

      if (!challenge?.["success"] || !challenge["captchaId"]) {
        throw new Error(challenge?.["error"] || "Failed to get a captcha");
      }

      const sliderX = await this.solveSliderCaptcha(challenge);

      /** The page posts the drag only after the pointer is released */
      const trace = buildSliderTrace(sliderX);

      await this.utils.delayForSeconds(trace.at(-1)[0] / 1000, {
        signal: this.signal,
      });

      const result = await this.verifyCaptcha(
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
  async logWithdrawalStatus() {
    await this.ensureStateLoaded();

    const pending = this.getPendingWithdrawals();
    const discountPercent = await this.readNftDiscountPercent();

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue(
      "Balance",
      this.formatAmount(this.getAccountDetails()["inAppBalance"]),
    );
    this.logger.keyValue("Minimum", this.getMinimumWithdrawal());
    this.logger.keyValue(
      "Verified",
      this.isAccountVerified(this.getAccountDetails()) ? "Yes" : "No",
      {
        valueStyle: this.isAccountVerified(this.getAccountDetails())
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );

    const cooldown = this.getWithdrawalCooldownMs();

    this.logger.keyValue(
      "Next Withdrawal",
      cooldown > 0 ? `In ${this.formatCooldown(cooldown)}` : "Now",
    );
    this.logger.keyValue(
      "Fee",
      this.formatAmount(this.getWithdrawalFee(discountPercent)),
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
