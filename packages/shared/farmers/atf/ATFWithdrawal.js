import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { logCurrentUser } from "../../lib/farmer/format.js";
import { WITHDRAWAL_CAPTCHA_ATTEMPTS } from "./constants.js";
import Decimal from "decimal.js";

/** Withdrawals, their captchas and the pending queue */
export default class ATFWithdrawal extends FarmerModule {
  /** Whether a rejected withdrawal was rejected over the captcha, using the app's own retry list */
  isWithdrawalCaptchaRejection(result) {
    const reason = String(result?.["reason"] || "");

    return (
      reason.startsWith("captcha") ||
      reason.startsWith("puzzle_") ||
      reason.startsWith("challenge_") ||
      reason === "trace_invalid"
    );
  }

  /** The drop grades an answer that came back too fast as a bot */
  async waitForCaptchaSolveTime(challenge, issuedAt) {
    const minSolveMs = Number(challenge["min_solve_ms"]) || 0;
    const remaining = minSolveMs - (Date.now() - issuedAt);

    await this.utils.delay(Math.max(2000, remaining), {
      precised: true,
      signal: this.signal,
    });
  }

  /** What to put above the captcha image, once a previous answer was rejected */
  buildCaptchaPromptText(challenge, rejection) {
    if (!rejection) {
      return "Solve the captcha to proceed with the withdrawal:";
    }

    const attemptsLeft = Number(
      challenge["attempts_left"] ?? rejection["attempts_left"],
    );

    return Number.isFinite(attemptsLeft)
      ? `${rejection["message"]} ${attemptsLeft} attempt(s) left:`
      : `${rejection["message"]} Try again:`;
  }

  /** Resolve one image captcha answer, falling back to asking the user when no provider solves it */
  async resolveImageCaptchaAnswer({ image, promptText, label = "captcha" }) {
    if (this.core.captcha.canSolveImage()) {
      try {
        this.logger.info(`Solving ${label}...`);

        const answer = await this.core.captcha.solveImage({ body: image });

        this.logger.info(`Solved ${label}:`, answer);

        return answer;
      } catch (error) {
        this.logger.error(`Failed to solve ${label}:`, error);
      }
    }

    if (!this.core.canPrompt()) {
      throw new Error(
        "No captcha provider is configured and there is no way to ask for the answer!",
      );
    }

    const answer = await this.core.prompt({
      type: "text",
      text: promptText,
      image,
    });

    this.logger.info("Your answer:", answer);

    return answer;
  }

  /** Resolve one withdrawal captcha answer. */
  resolveCaptchaAnswer(challenge, rejection) {
    return this.resolveImageCaptchaAnswer({
      image: challenge["captcha_image"],
      promptText: this.buildCaptchaPromptText(challenge, rejection),
      label: "withdrawal captcha",
    });
  }

  /** Ask for the withdrawal captcha until the drop accepts it */
  async requestWithdrawalWithCaptcha(amount) {
    let challenge = await this.ctx.api.getWithdrawalPuzzle(amount.toNumber());
    let issuedAt = Date.now();
    let rejection = null;
    let attempt = 0;

    while (true) {
      if (this.signal.aborted) {
        throw new Error("Withdrawal aborted");
      }

      attempt++;

      /** The drop can waive the captcha, leaving nothing to ask */
      let answer = "";

      /** The app always asks for an answer when an image comes back */
      if (challenge["is_captcha"] || challenge["captcha_image"]) {
        answer = await this.resolveCaptchaAnswer(challenge, rejection);

        /** An answer that comes back too fast is graded as a bot */
        await this.waitForCaptchaSolveTime(challenge, issuedAt);
      }

      const result = await this.ctx.api.requestWithdrawal({
        amount: amount.toNumber(),
        withdraw_captcha_id: challenge["challenge_id"],
        withdraw_captcha_answer: answer,
      });

      /** Success, or a refusal that answering again cannot fix */
      if (!this.isWithdrawalCaptchaRejection(result)) {
        return result;
      }

      rejection = result;
      this.logger.error("Captcha rejected:", result["message"]);

      if (result["locked"]) {
        this.logger.error(
          "Withdrawals are locked until",
          new Date(Number(result["lock_until"]) * 1000).toLocaleString(),
        );
        return result;
      }

      const attemptsLeft = Number(result["attempts_left"]);

      if (attemptsLeft <= 0) {
        this.logger.error("No captcha attempts left.");
        return result;
      }

      if (attempt >= WITHDRAWAL_CAPTCHA_ATTEMPTS) {
        this.logger.error(
          `Giving up after ${WITHDRAWAL_CAPTCHA_ATTEMPTS} failed captcha attempts.`,
        );
        return result;
      }

      /** The image is regenerated on every failure, so ask for the new one */
      this.logger.warn("Fetching a new captcha...");
      challenge = await this.ctx.api.getWithdrawalPuzzle(amount.toNumber());
      issuedAt = Date.now();
    }
  }

  /** Place withdrawal */
  async place({ max, difference }) {
    const { user } = this.ctx.state.data;
    const balance = new Decimal(user["mined_balance"]);

    if (!user["wallet_public_key"]) {
      return this.ctx.flow.skip("No wallet public key found!");
    }

    const minimum = this.ctx.flow.minimum();
    const lowBalance = this.ctx.flow.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    const amount = this.ctx.flow.pickAmount({
      balance,
      minimum,
      max,
      difference,
    });

    /** Record Navigation Batch */
    await this.ctx.activity.recordNavigationBatch(1);

    /** Solve the withdrawal captcha, re-asking while the answer is rejected */
    const result = await this.requestWithdrawalWithCaptcha(amount);

    /** Check status */
    const status = result.status === "success";
    const message = result.message;

    /** Withdrawn amount */
    let withdrawn = amount;

    if (status) {
      /** Update balance */
      this.ctx.state.data.user["mined_balance"] = result["new_balance"];

      /** Set withdrawn amount */
      withdrawn = new Decimal(result["send_amount"]).floor();

      /** Log result */
      this.logger.success(result["message"]);
      this.logger.keyValue("ID", result["withdraw_id"]);
      this.logger.keyValue("Requested amount", result["requested_amount"]);
      this.logger.keyValue("Amount to be received", result["send_amount"]);

      await this.ctx.flow.notify([
        ["Initial Balance", balance.toString()],
        ["Requested", result["requested_amount"]],
        ["To receive", result["send_amount"]],
        ["New Balance", result["new_balance"]],
        ["Withdraw ID", `<code>${result["withdraw_id"]}</code>`],
      ]);
    } else {
      this.logger.error("Failed to request withdrawal:", result["message"]);
    }

    return {
      status,
      message,
      result,
      skipped: false,
      amount: withdrawn.toString(),
    };
  }

  /** Both withdrawal gates, from the same read the queue uses */
  async getWithdrawalGuard() {
    const { pending, flagged } = await this.ctx.withdrawals.load();

    return { pending: pending.length > 0, flagged: flagged.length > 0 };
  }

  /** The withdrawals the drop has not settled yet */
  getPendingWithdrawals() {
    return this.ctx.withdrawals.pending();
  }

  /** Log the withdrawals the drop has not settled yet */
  async logPendingWithdrawals() {
    const pending = await this.getPendingWithdrawals();

    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue(
      "Verified",
      this.ctx.account.isUserVerified(this.ctx.state.user()) ? "Yes" : "No",
    );
    this.logger.keyValue("Pending Withdrawals", pending.length, {
      valueStyle: pending.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });

    if (pending.length === 0) {
      this.logger.success("No withdrawal is awaiting processing.");
      return { status: true, pending };
    }

    for (const item of pending) {
      this.logger.newline();

      for (const [key, value] of Object.entries(item)) {
        if (value === null || typeof value === "object") {
          continue;
        }

        this.logger.keyValue(this.formatWithdrawalField(key), String(value), {
          format: false,
        });
      }
    }

    this.logger.newline();
    this.logger.warn(
      `${pending.length} withdrawal(s) still awaiting processing.`,
    );

    return { status: true, pending };
  }

  /** `send_amount` -> `Send Amount` */
  formatWithdrawalField(key) {
    return key
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
}
