import Decimal from "decimal.js";
import AutoOperation from "./AutoOperation.js";
import logger from "../../logger.js";

/** Have this server's accounts withdraw for flipped accounts from an export, each adopting a freed wallet in turn */
class RescueOperation extends AutoOperation {
  /** Rescue */
  run() {
    const { ctx, fmt } = this;
    const helpers = ctx.accounts;

    /** Adopting a wallet needs its phrase as well as its address and version */
    const requesters = (this.options.requesters || []).filter(
      (requester) =>
        requester?.address && requester?.version && requester?.phrase,
    );

    return this.guard("during rescue", async () => {
      await this.notify.send([
        `⏳ ${this.title} - Rescue initiated...`,
        fmt.formatKeyValue("Requesters", `${requesters.length}`),
        fmt.formatKeyValue("Helpers", `${helpers.length}`),
        fmt.formatSetting("delay"),
      ]);

      if (!requesters.length) {
        await this.notify.send([
          `⏩ ${this.title} - no requester to withdraw for.`,
        ]);
        return;
      }

      const results = [];

      const worked = await ctx.helpers.withHelpers(helpers, async (runners) => {
        /** Reading the helpers is also what reports a settled withdrawal */
        const available = await ctx.helpers.getAvailable(
          helpers,
          runners,
          await ctx.records.getOutstandingAssists(helpers),
        );

        if (!available.length) {
          await this.notify.send([
            `⏩ ${this.title} - no helper is free. ${requesters.length} account(s) waiting.`,
          ]);
          return false;
        }

        await this.notify.send([
          `⏳ ${this.title} - Rescuing ${requesters.length} account(s) through ${available.length} helper(s)...`,
        ]);

        await ctx.helpers.runPool({
          items: requesters,
          available,
          runners,
          label: (requester) => fmt.formatRequesterLabel(requester),
          requesterId: (requester) =>
            String(requester.userId || requester.address),
          attempt: (requester, helper, helperEntry) =>
            this.withdrawThroughWallet({
              requester,
              helper,
              helperRunner: helperEntry.runner,
            }),
          scope: "run",
          leftOver: "left",
          results,
        });

        return true;
      });

      if (!worked) return;

      await this.sendCompletion(`✅ ${this.title} - Rescue completed!`);

      const totalWithdrawn = results
        .filter((result) => result.status && !result.skipped)
        .reduce((acc, result) => acc.plus(result.amount || 0), new Decimal(0));

      await this.notify.sendSummary(
        results,
        [
          fmt.formatKeyValue(
            "Total withdrawn",
            `🤑 ${fmt.formatAmount(totalWithdrawn)} ${this.currency}`,
          ),
        ],
        requesters.length,
      );
    });
  }

  /** Withdraw a freed wallet's pool through a helper, which adopts it for one withdrawal and goes back to its own */
  async withdrawThroughWallet({ requester, helper, helperRunner }) {
    const { ctx } = this;
    const helperPhrase = await ctx.decryptPhrase(helper.encryptedPhrase);

    /** Some drops sign a wallet proof, so the phrase travels with the address */
    const adopted = await helperRunner.connectAutoWallet({
      phrase: requester.phrase,
      address: requester.address,
      version: requester.version,
    });

    /** Nothing moved, most often because the account was never flipped */
    if (!adopted.status) {
      return {
        status: false,
        skipped: true,
        amount: "0",
        message: `Could not adopt its wallet (was it flipped?): ${adopted.message || "Unknown error"}`,
      };
    }

    const restore = () =>
      ctx.wallet.connectOrThrow(
        helperRunner,
        { phrase: helperPhrase, version: helper.version },
        "helper restore failed",
      );

    /** The helper must never be left holding someone else's wallet */
    const announceStranded = () =>
      this.notify.sendStrandedWallet({
        requester,
        helper,
        requesterMoved: false,
        helperMoved: true,
      });

    let withdrawal;

    try {
      withdrawal = await helperRunner.withdraw({ force: true, difference: 0 });
    } catch (error) {
      try {
        await restore();
      } catch (restoreError) {
        logger.error("Failed to restore helper wallet:", restoreError.message);
        await announceStranded();
      }

      throw error;
    }

    try {
      await restore();
    } catch (error) {
      await announceStranded();
      throw error;
    }

    return withdrawal;
  }
}

export default RescueOperation;
