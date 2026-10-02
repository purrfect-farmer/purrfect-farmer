import AutoOperation from "./AutoOperation.js";
import logger from "../../logger.js";
import { ASSIST_OWNER } from "../constants.js";

/** Pay each account's one-time wallet verification from its own phrase, for drops that require one */
class VerifyOperation extends AutoOperation {
  /** Verify */
  run() {
    const { fmt } = this;

    return this.runBatch({
      intro: [
        `⏳ ${this.title} - Verification initiated...`,
        fmt.formatSetting("accounts"),
      ],
      process: (account, index) => this.processVerify(account, index),
      completed: `✅ ${this.title} - Verification completed!`,
      summarize: (results) => {
        const count = (predicate) => `${results.filter(predicate).length}`;

        return this.notify.sendSummary(results, [
          fmt.formatKeyValue(
            "Newly verified",
            count((result) => result.status && !result.skipped),
          ),
          fmt.formatKeyValue(
            "Already verified",
            count((result) => result.status && result.skipped),
          ),
        ]);
      },
      errorPhrase: "during verification",
    });
  }

  /** Verify a single account */
  async processVerify(account, index) {
    const { ctx, fmt } = this;

    if (!account.userId) return { status: false, skipped: true };

    const cloudAccount = await ctx.getCloudAccount(account, true);

    if (!cloudAccount) return { status: false, skipped: true };

    const label = fmt.formatAccountLink(account.userId);
    const position = fmt.formatAccountPosition(index);

    /** The assist and cultivate loops must not move funds out mid-payment */
    if (!ctx.claim(account.userId, ASSIST_OWNER)) {
      await this.notify.send([
        `⏩ Skipped <b>(${label})</b> - it is being ${ctx.holder(account.userId)}ed right now. ${position}`,
      ]);
      return { status: false, skipped: true };
    }

    let result;

    try {
      logger.info("Verifying account:", account.userId);

      const phrase = await ctx.decryptPhrase(account.encryptedPhrase);
      const runner = await ctx.getRunner(cloudAccount);

      result = await runner.verifyAutoWallet({
        phrase,
        version: Number(account.version),
      });

      await ctx.records.storeSnapshot(runner, cloudAccount);

      await this.notify.send([
        result.skipped
          ? `⏩ Already verified <b>(${label})</b> ${position}`
          : result.status
            ? `🛡️ Verified <b>(${label})</b> ${position}`
            : `❌ Not verified <b>(${label})</b> ${position}\n<i>Reason: ${result.message || "Unknown error!"}</i>`,
      ]);
    } catch (error) {
      if (ctx.aborted) return null;

      const errorMessage = error.message || "Unknown error!";

      logger.error("Failed to verify:", account.userId, errorMessage);

      result = { status: false, skipped: false, message: errorMessage };

      await this.notify.send([
        `❌ Failed to verify <b>(${label})</b> ${position}\n<i>Reason: ${errorMessage}</i>`,
      ]);
    } finally {
      ctx.releaseRunner(cloudAccount);
      ctx.release(account.userId, ASSIST_OWNER);
    }

    if (!this.isLastAccount(index)) {
      await ctx.delaySafeSeconds();
    }

    return result;
  }
}

export default VerifyOperation;
