import AutoOperation from "./AutoOperation.js";
import BaseSwapper from "@purrfect/shared/lib/auto/BaseSwapper.js";
import Decimal from "decimal.js";
import logger from "../../logger.js";

/** Swap every selected account's TON into the drop's jetton */
class SwapOperation extends AutoOperation {
  /** Swap */
  run() {
    const { fmt } = this;

    return this.runBatch({
      intro: [
        `⏳ ${this.title} - Swap initiated...`,
        ...fmt.formatSettings("accounts", "slippage"),
      ],
      process: (account, index) => this.processSwap(account, index),
      completed: `✅ ${this.title} - Swap completed!`,
      summarize: (results) => {
        const total = (key) =>
          results.reduce(
            (acc, result) => acc.plus(result[key] || 0),
            new Decimal(0),
          );

        return this.notify.sendSummary(results, [
          fmt.formatKeyValue(
            "Total swapped",
            `🔄 ${fmt.formatAmount(total("swapped"))} TON`,
          ),
          fmt.formatKeyValue(
            "Expected received",
            `💰 ${fmt.formatAmount(total("expected"))} ${this.token}`,
          ),
        ]);
      },
      errorPhrase: "during swap",
    });
  }

  /** Process swap */
  async processSwap(account, index) {
    const { ctx, fmt } = this;

    const phrase = await ctx.decryptPhrase(account.encryptedPhrase);
    const swapper = new BaseSwapper(
      {
        tonCenterApiKey: ctx.master.tonCenterApiKey,
        address: account.address,
        version: account.version,
        phrase,
      },
      ctx.jettonAddress,
      { token: this.token, referralAddress: this.options.referralAddress },
    );

    logger.info("Swapping account:", account.address);

    let result;

    try {
      result = await swapper.swapAll({ slippage: this.options.slippage });
    } catch (error) {
      if (ctx.aborted) throw error;
      result = { status: false, error };
    }

    const { status, skipped, swapped, expected, path, error } = result;

    const link = fmt.formatAddressLink(account.address);
    const position = fmt.formatAccountPosition(index);
    const via = path?.length > 2 ? ` via ${path.slice(1, -1).join(" → ")}` : "";

    await this.notify.send([
      skipped
        ? `⏩ Skipped <b>(${link})</b> ${position}`
        : status
          ? `🔄 Swapped <b>(${link})</b> - <i>${fmt.formatAmount(swapped)} TON → ~${fmt.formatAmount(expected)} ${this.token}</i>${via} ${position}`
          : `❌ Failed to swap <b>(${link})</b> ${position}\n<i>Error: ${error?.message || "Unknown error!"}</i>`,
    ]);

    logger.success("Completed swap:", account.address);

    await ctx.delaySeconds(2);

    return result;
  }
}

export default SwapOperation;
