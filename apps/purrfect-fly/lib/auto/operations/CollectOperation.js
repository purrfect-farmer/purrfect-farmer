import Decimal from "decimal.js";
import AutoOperation from "./AutoOperation.js";
import logger from "../../logger.js";
import { COLLECT_SKIP_REASONS } from "@purrfect/shared/lib/auto/collectPlan.js";

/** Why an account was passed over, as the skip message reads */
const SKIP_REASONS = {
  [COLLECT_SKIP_REASONS.EMPTY]: "nothing to collect",
  [COLLECT_SKIP_REASONS.RETAINED]: "within retain",
  [COLLECT_SKIP_REASONS.BELOW_MINIMUM]: "below minimum",
};

/** Pull every selected account's tokens back into the master */
class CollectOperation extends AutoOperation {
  /** Collect */
  run() {
    const { ctx, fmt } = this;

    return this.runBatch({
      intro: [
        `⏳ ${this.title} - Collection initiated...`,
        ...fmt.formatSettings("accounts", "retain", "minCollect"),
      ],
      prepare: () => ctx.masterWallet.prepareInitial(),
      process: (account, index) => this.processCollect(account, index),
      completed: `✅ ${this.title} - Collection completed!`,
      summarize: (results) => {
        const sum = (key) =>
          results.reduce(
            (acc, result) => acc.plus(result[key] || 0),
            new Decimal(0),
          );

        return this.notify.sendSummary(results, [
          fmt.formatKeyValue(
            "Total collected",
            `💰 ${fmt.formatAmount(sum("collected"))} ${this.token}`,
          ),
          fmt.formatKeyValue(
            "Total retained",
            `🔒 ${fmt.formatAmount(sum("retained"))} ${this.token}`,
          ),
        ]);
      },
      errorPhrase: "during collection",
    });
  }

  /** Process collect */
  async processCollect(account, index) {
    const { ctx, fmt, options } = this;

    const phrase = await ctx.decryptPhrase(account.encryptedPhrase);
    const booster = ctx.masterWallet.createBooster({ ...account, phrase });

    logger.info("Collecting account:", account.address);
    const result = await booster.collect({
      retainMin: options.retainMin,
      retainMax: options.retainMax,
      minCollect: options.minCollect,
    });
    const { status, skipped, reason, collected, retained, error } = result;

    const link = fmt.formatAddressLink(account.address);
    const position = fmt.formatAccountPosition(index);

    await this.notify.send([
      skipped
        ? `⏩ Skipped <b>(${link})</b> - <i>${SKIP_REASONS[reason] || "nothing to collect"}</i> ${position}`
        : status
          ? `💰 Collected <b>(${link})</b> - <i>${collected?.toString()} ${this.token}</i>${retained?.gt(0) ? `, retained <i>${fmt.formatAmount(retained)} ${this.token}</i>` : ""} ${position}`
          : `❌ Failed to collect <b>(${link})</b> ${position}\n<i>Error: ${error?.message || "Unknown error!"}</i>`,
    ]);

    logger.success("Completed collection:", account.address);

    await ctx.delaySeconds(2);

    return result;
  }
}

export default CollectOperation;
