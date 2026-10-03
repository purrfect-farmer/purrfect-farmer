import Decimal from "decimal.js";
import app from "../../config/app.js";
import bot from "../bot.js";
import { NOTIFICATION_OPTIONS } from "./constants.js";

/** Sends a run's messages to its operator, the operations chat and, when asked, the admin */
class AutoNotifier {
  /** @param {import("./AutoContext.js").default} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get fmt() {
    return this.ctx.fmt;
  }

  /** Send Notification */
  async send(messages) {
    await bot.sendPrivateMessage(this.ctx.id, messages, NOTIFICATION_OPTIONS);
    await bot.sendOperationMessage(messages, NOTIFICATION_OPTIONS);
  }

  /** Send a notification that also reaches the server admin, who is not always the operator */
  async sendAdmin(messages) {
    await this.send(messages);

    /** The operator has already had it in their own chat */
    if (String(app.admin.telegramId) === String(this.ctx.id)) return;

    await bot.sendAdminMessage(messages, NOTIFICATION_OPTIONS);
  }

  /** Sent as soon as the run is cancelled */
  sendStopping() {
    return this.send([`<i>🛑 ${this.ctx.title} - Stopping operation...</i>`]);
  }

  /** Sent once a cancelled run has wound down */
  sendCancellationCompletion() {
    return this.send([
      `<i>🛑 ${this.ctx.title} - Operation stopped. Remaining accounts skipped.</i>`,
    ]);
  }

  /** Sent when a run is asked for while another holds the slot */
  sendPendingOperation() {
    return this.send([
      `<i>⚠️ ${this.ctx.title} - an operation is currently in progress. Please cancel it first!</i>`,
    ]);
  }

  /** Tell the operator a wallet exchange could not be undone */
  sendStrandedWallet({ requester, helper, requesterMoved, helperMoved }) {
    return this.send([
      `🚨 ${this.ctx.title} - a wallet could not be restored!`,
      this.fmt.formatKeyValue(
        "Requester",
        `${this.fmt.formatRequesterLabel(requester)}${
          requesterMoved
            ? " - <b>on a throwaway wallet</b>"
            : helperMoved
              ? " - <b>its wallet is held by the helper</b>"
              : ""
        }`,
      ),
      this.fmt.formatKeyValue(
        "Helper",
        `${this.fmt.formatAccountLink(helper.userId)}${helperMoved ? " - <b>holding the requester's wallet</b>" : ""}`,
      ),
      `<i>Reconnect it by hand before running anything else on it.</i>`,
    ]);
  }

  /** Get Summary Counts */
  getSummaryCounts(results) {
    const successful = results.filter(
      (result) => result.status && !result.skipped,
    ).length;
    const failed = results.filter(
      (result) => !result.status && !result.skipped,
    ).length;
    const skipped = results.filter((result) => result.skipped).length;
    const total = results.filter((result) => !result.skipped).length;

    return {
      successful,
      failed,
      skipped,
      total,
    };
  }

  /** Send Summary Notification */
  sendSummary(results, messages, expected = this.ctx.accounts.length) {
    const { successful, failed, skipped, total } =
      this.getSummaryCounts(results);
    return this.send([
      "ℹ️ Operation Summary",
      ...messages,
      this.fmt.formatKeyValue("Total Accounts", `${total}/${expected}`),
      this.fmt.formatKeyValue("Successful Accounts", `${successful}`),
      this.fmt.formatKeyValue("Skipped Accounts", `${skipped}`),
      this.fmt.formatKeyValue("Failed Accounts", `${failed}`),
    ]);
  }

  /** Send Boost Summary Notification */
  sendBoostSummary(results) {
    const { options, token, master } = this.ctx;
    const { masterData } = this.ctx.masterWallet;

    /** What actually left the master, so a run that only connected wallets reads as zero */
    const boostedAccounts = results.filter((result) =>
      new Decimal(result.boosted || 0).greaterThan(0),
    );

    const totalBoosted = boostedAccounts.reduce(
      (acc, result) => acc.plus(result.boosted),
      new Decimal(0),
    );

    /** Only the requests the drop took, since a refusal moved nothing */
    const withdrawals = results
      .map((result) => result.withdrawal)
      .filter((withdrawal) => withdrawal?.status);

    const totalWithdrawn = withdrawals.reduce(
      (acc, withdrawal) => acc.plus(withdrawal.amount || 0),
      new Decimal(0),
    );

    return this.sendSummary(results, [
      this.fmt.formatKeyValue(
        "Total boosted",
        `⚡ ${this.fmt.formatAmount(totalBoosted)} ${token}`,
      ),
      this.fmt.formatKeyValue("Boosted Accounts", `${boostedAccounts.length}`),
      ...(options.flipAfterBoost
        ? [
            this.fmt.formatKeyValue(
              "Flipped Accounts",
              `${results.filter((result) => result.flipped).length}`,
            ),
          ]
        : []),
      ...(options.withdrawAfterBoost
        ? [
            this.fmt.formatKeyValue(
              "Total withdrawn",
              `🤑 ${this.fmt.formatAmount(totalWithdrawn)} ${this.ctx.currency}`,
            ),
            this.fmt.formatKeyValue(
              "Withdrawn Accounts",
              `${withdrawals.length}`,
            ),
          ]
        : []),
      /** Where the funds were left, so a retained run says which wallet to look at */
      ...(options.retainFunds &&
      masterData?.address &&
      masterData.address !== master.address
        ? [
            this.fmt.formatKeyValue(
              "Funds retained in",
              this.fmt.formatAddressLink(masterData.address),
            ),
          ]
        : []),
    ]);
  }
}

export default AutoNotifier;
