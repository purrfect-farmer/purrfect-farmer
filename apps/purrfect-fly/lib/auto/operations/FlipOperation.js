import AutoOperation from "./AutoOperation.js";
import logger from "../../logger.js";
import { ASSIST_OWNER } from "../constants.js";

/** Connect each account to its phrase's other contract version, freeing its own wallet, or back onto its own wallet */
class FlipOperation extends AutoOperation {
  /** Flip */
  run() {
    const { fmt } = this;

    return this.runBatch({
      intro: [
        `⏳ ${this.title} - Flip initiated...`,
        ...fmt.formatSettings("accounts", "flipDirection", "delay"),
      ],
      process: (account, index) => this.processFlip(account, index),
      completed: `✅ ${this.title} - Flip completed!`,
      summarize: (results) =>
        this.notify.sendSummary(results, [fmt.formatSetting("flipDirection")]),
      errorPhrase: "during flip",
    });
  }

  /** The contract version a flip connects an account to */
  getFlipVersion(account) {
    if (this.options.flipDirection === "restore") return Number(account.version);

    return Number(account.version) === 4 ? 5 : 4;
  }

  /** Flip a single account, leaving what is stored locally untouched */
  async processFlip(account, index) {
    const { ctx, fmt } = this;

    if (!account.userId) return { status: false, skipped: true };

    const cloudAccount = await ctx.getCloudAccount(account, true);

    if (!cloudAccount) return { status: false, skipped: true };

    const label = fmt.formatAccountLink(account.userId);
    const position = fmt.formatAccountPosition(index);

    /** The assist and cultivate loops must not pick it up mid-flip */
    if (!ctx.claim(account.userId, ASSIST_OWNER)) {
      await this.notify.send([
        `⏩ Skipped <b>(${label})</b> - it is being ${ctx.holder(account.userId)}ed right now. ${position}`,
      ]);
      return { status: false, skipped: true };
    }

    let result;

    try {
      const phrase = await ctx.decryptPhrase(account.encryptedPhrase);
      const version = this.getFlipVersion(account);
      const runner = await ctx.getRunner(cloudAccount);

      /** Keeps the stored snapshot on the wallet it is now connected to */
      const address = await ctx.wallet.connectVersion(runner, phrase, version);

      result = { status: true, skipped: false };

      await this.notify.send([
        `${this.options.flipDirection === "flip" ? "🔁 Flipped" : "↩️ Restored"} <b>(${label})</b> - ${fmt.formatWallet({ address, version: `v${version}` })} ${position}`,
      ]);
    } catch (error) {
      if (ctx.aborted) return null;

      const errorMessage = error.message || "Unknown error!";

      logger.error("Failed to flip:", account.userId, errorMessage);

      result = { status: false, skipped: false, message: errorMessage };

      await this.notify.send([
        `❌ Failed to flip <b>(${label})</b> ${position}\n<i>Reason: ${errorMessage}</i>`,
      ]);
    } finally {
      ctx.releaseRunner(cloudAccount);
      ctx.release(account.userId, ASSIST_OWNER);
    }

    if (!this.isLastAccount(index)) {
      await ctx.delaySafeMinutes();
    }

    return result;
  }
}

export default FlipOperation;
