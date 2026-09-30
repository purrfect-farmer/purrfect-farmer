import Decimal from "decimal.js";
import AutoOperation from "./AutoOperation.js";
import logger from "../../logger.js";
import { isWithdrawable } from "../summary.js";

/** Read and report every selected account */
class StatusOperation extends AutoOperation {
  /** Status */
  run() {
    const { fmt } = this;

    return this.runBatch({
      intro: [
        `⏳ ${this.title} - Status request initiated...`,
        ...fmt.formatSettings("accounts", "includeFrozen"),
      ],
      process: (account, index) => this.processStatus(account, index),
      completed: `✅ ${this.title} - Status request completed.`,
      summarize: (results) => {
        const sum = (list) =>
          list.reduce(
            (acc, result) => acc.plus(result.summary?.balance || 0),
            new Decimal(0),
          );

        const withdrawable = results.filter((result) =>
          isWithdrawable(result.summary),
        );

        return this.notify.sendSummary(results, [
          fmt.formatKeyValue(
            "Total mined",
            `💰 ${fmt.formatAmount(sum(results))} ${this.token}`,
          ),
          fmt.formatKeyValue(
            "Withdrawable Amount",
            `🤑 ${fmt.formatAmount(sum(withdrawable))} ${this.token}`,
          ),
          fmt.formatKeyValue("Withdrawable Accounts", `${withdrawable.length}`),
        ]);
      },
      errorPhrase: "during status request",
    });
  }

  /** Get account status */
  async processStatus(account, index) {
    const { ctx, fmt } = this;

    if (!account.userId) return;

    const cloudAccount = await ctx.getCloudAccount(
      account,
      this.options.includeFrozen,
    );

    if (!cloudAccount) return;

    const result = await this.getUserStatus(cloudAccount);
    const { status, summary, message } = result;

    const link = fmt.formatAccountLink(cloudAccount.id);
    const position = fmt.formatAccountPosition(index);

    await this.notify.send(
      status
        ? [
            `ℹ️ User details <b>(${link})</b> ${position}`,
            "",
            ...fmt.formatSummaryDetails(summary),
          ]
        : [
            `❌ Failed to get user details <b>(${link})</b> ${position}`,
            `<i>Error: ${message}</i>`,
          ],
    );

    if (!this.isLastAccount(index)) {
      await ctx.delaySafeSeconds();
    }

    return result;
  }

  /** Log in, claim what is pending, and record the account */
  async getUserStatus(cloudAccount) {
    const { ctx } = this;

    try {
      logger.info("Getting account status:", cloudAccount.id);

      const runner = await ctx.getRunner(cloudAccount);

      await ctx.delaySeconds(2);

      /** Claim whatever is pending so the balance is current */
      await runner.refreshAutoState();

      await ctx.delaySeconds(2);

      /** Re-read the account so the snapshot carries the current holding */
      const summary = await runner.refreshAutoSummary();

      /** Record it, and report the snapshot instead, since it also carries the payout record */
      const snapshot = await ctx.records.storeSnapshot(runner, cloudAccount);

      /** A read account goes back to farming */
      await ctx.wallet.activateFarmer(runner, cloudAccount);

      return { status: true, summary: snapshot || summary };
    } catch (e) {
      const errorMessage = e.message || "Unknown error!";

      logger.error(errorMessage);

      return {
        status: false,
        message: errorMessage,
      };
    }
  }
}

export default StatusOperation;
