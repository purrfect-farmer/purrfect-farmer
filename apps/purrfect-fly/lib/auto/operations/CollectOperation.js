import Decimal from "decimal.js";
import AutoOperation from "./AutoOperation.js";
import logger from "../../logger.js";

/** Pull every selected account's tokens back into the master */
class CollectOperation extends AutoOperation {
  /** Collect */
  run() {
    const { ctx, fmt } = this;

    return this.runBatch({
      intro: [
        `⏳ ${this.title} - Collection initiated...`,
        fmt.formatSetting("accounts"),
      ],
      prepare: () => ctx.masterWallet.prepareInitial(),
      process: (account, index) => this.processCollect(account, index),
      completed: `✅ ${this.title} - Collection completed!`,
      summarize: (results) => {
        const total = results.reduce(
          (acc, result) => acc.plus(result.collected || 0),
          new Decimal(0),
        );

        return this.notify.sendSummary(results, [
          fmt.formatKeyValue(
            "Total collected",
            `💰 ${fmt.formatAmount(total)} ${this.token}`,
          ),
        ]);
      },
      errorPhrase: "during collection",
    });
  }

  /** Process collect */
  async processCollect(account, index) {
    const { ctx, fmt } = this;

    const phrase = await ctx.decryptPhrase(account.encryptedPhrase);
    const booster = ctx.masterWallet.createBooster({ ...account, phrase });

    logger.info("Collecting account:", account.address);
    const result = await booster.collect();
    const { status, skipped, collected, error } = result;

    const link = fmt.formatAddressLink(account.address);
    const position = fmt.formatAccountPosition(index);

    await this.notify.send([
      skipped
        ? `⏩ Skipped <b>(${link})</b> ${position}`
        : status
          ? `💰 Collected <b>(${link})</b> - <i>${collected?.toString()} ${this.token}</i> ${position}`
          : `❌ Failed to collect <b>(${link})</b> ${position}\n<i>Error: ${error?.message || "Unknown error!"}</i>`,
    ]);

    logger.success("Completed collection:", account.address);

    await ctx.delaySeconds(2);

    return result;
  }
}

export default CollectOperation;
