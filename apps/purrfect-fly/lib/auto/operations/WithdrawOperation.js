import Decimal from "decimal.js";
import AutoOperation from "./AutoOperation.js";

/** Withdraw every selected account's pool on its own */
class WithdrawOperation extends AutoOperation {
  /** Withdraw */
  run() {
    const { fmt } = this;

    return this.runBatch({
      intro: [
        `⏳ ${this.title} - Withdrawal initiated...`,
        ...fmt.formatSettings("accounts", "delay", "difference", "amount"),
      ],
      process: (account, index) => this.processWithdraw(account, index),
      completed: `✅ ${this.title} - Withdrawal completed!`,
      summarize: (results) => {
        const available = results.reduce(
          (acc, result) => acc.plus(result.amount || 0),
          new Decimal(0),
        );

        const withdrawn = results
          .filter((result) => result.status)
          .reduce((acc, result) => acc.plus(result.amount || 0), new Decimal(0));

        return this.notify.sendSummary(results, [
          fmt.formatKeyValue(
            "Total withdrawn",
            `🤑 ${fmt.formatAmount(withdrawn)}/${fmt.formatAmount(available)} ${this.currency}`,
          ),
        ]);
      },
      errorPhrase: "during withdrawal",
    });
  }

  /** Withdraw account */
  async processWithdraw(account, index) {
    const { ctx, fmt } = this;

    if (!account.userId) return;

    const cloudAccount = await ctx.getCloudAccount(account, true);

    if (!cloudAccount) return;

    const result = await ctx.withdrawer.request(cloudAccount);
    const { status, skipped, message, amount } = result;

    await this.notify.send([
      fmt.formatWithdrawalOutcome({
        label: fmt.formatAccountLink(cloudAccount.id),
        status,
        skipped,
        amount,
        message,
        position: fmt.formatAccountPosition(index),
      }),
    ]);

    if (!this.isLastAccount(index)) {
      if (skipped) {
        await ctx.delaySafeSeconds();
      } else {
        await ctx.delaySafeMinutes();
      }
    }

    return result;
  }
}

export default WithdrawOperation;
