import AutoOperation from "./AutoOperation.js";
import logger from "../../logger.js";

/** Boost or collect exactly one account, resolving with the result instead of notifying */
class SingleOperation extends AutoOperation {
  /** Instantiate a booster for the single account, with its phrase decrypted */
  async prepareBooster() {
    const { ctx } = this;

    await ctx.masterWallet.prepareInitial();

    /** The single operations always carry exactly one account */
    const account = ctx.accounts[0];

    logger.info("Decrypting wallet phrase:", account.address);
    const phrase = await ctx.decryptPhrase(account.encryptedPhrase);
    logger.success("Successfully decrypted wallet phrase:", account.address);

    return ctx.masterWallet.createBooster({ ...account, phrase });
  }

  /** The wallet account carries the decrypted phrase, so only plain values go back to the caller */
  formatResult({ status, skipped, jettonAmount, collected, error }) {
    return {
      status,
      skipped,
      jettonAmount: jettonAmount?.toString(),
      collected: collected?.toString(),
      error: error ? { message: error.message || "Unknown error!" } : null,
    };
  }

  /** Boost one account and nothing else: the same transfer the local booster performs */
  async boost() {
    const { ctx, options } = this;
    const booster = await this.prepareBooster();
    const { userId, address } = ctx.accounts[0];

    logger.info("Boosting single account:", address);
    const result = await booster.boost({
      difference: options.difference,
      amount: await ctx.records.readLastBoostAmount(userId),
      max: options.amount,
    });

    /** The bulk loop overlaps this transfer with its own delay, but a single boost
     * has nothing to overlap with and must report whether it actually landed */
    if (result.transfer) {
      const transfer = await result.transfer;

      if (!transfer.status) {
        logger.error("Failed single boost:", address);
        return this.formatResult({
          ...result,
          status: false,
          error: transfer.error,
        });
      }
    }

    logger.success("Completed single boost:", address);

    /** Only a transfer that landed is worth repeating later */
    if (!result.skipped) {
      await ctx.records.storeLastBoostAmount(userId, result.jettonAmount);
    }

    return this.formatResult(result);
  }

  /** Collect one account and nothing else */
  async collect() {
    const booster = await this.prepareBooster();
    const { address } = this.ctx.accounts[0];

    logger.info("Collecting single account:", address);
    const result = await booster.collect();
    logger.success("Completed single collection:", address);

    return this.formatResult(result);
  }
}

export default SingleOperation;
