import logger from "../logger.js";
import { isProtectedBuyer, isWithdrawable } from "./summary.js";

/** Places withdrawals, both on their own and in the middle of a boost */
class AutoWithdrawer {
  /** @param {import("./AutoContext.js").default} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** Re-read and record an account the drop has just paid out */
  async refreshWithdrawn(runner, cloudAccount) {
    /** Give the drop a moment to record the withdrawal */
    await this.ctx.delaySeconds(5);

    try {
      await runner.refreshAutoSummary();

      /** The snapshot is the summary plus the payout record this withdrawal has just changed */
      return await runner.storeAutoSnapshot();
    } catch (e) {
      logger.error(
        "Failed to refresh withdrawn account:",
        cloudAccount.id,
        e.message,
      );

      /** Stale in the flags, but still truthful about the new balance */
      return runner.getAutoSummary();
    }
  }

  /** Re-read the standing a withdrawal is reviewed against, which a plain login caches */
  async requalifyAfter({ cloudAccount, runner, walletAccount, summary }) {
    const strategy = this.ctx.options.requalify;

    /** A second boost pass restores the standing later in the cycle, not here */
    if (strategy !== "resync" || !runner || !walletAccount) {
      return { attempted: false, strategy, restored: false, summary };
    }

    /** Nothing to win back */
    if (isProtectedBuyer(summary)) {
      return { attempted: false, strategy, restored: true, summary };
    }

    let current = summary;

    try {
      logger.info("Requalifying withdrawn account:", cloudAccount.id, strategy);

      current =
        (await this.ctx.wallet.resync(runner, walletAccount)) || current;

      await this.ctx.records.storeSnapshot(runner, cloudAccount);

      return {
        attempted: true,
        strategy,
        restored: isProtectedBuyer(current),
        summary: current,
      };
    } catch (e) {
      logger.error(
        "Failed to requalify the withdrawn account:",
        cloudAccount.id,
        e.message,
      );

      return {
        attempted: true,
        strategy,
        restored: isProtectedBuyer(current),
        summary: current,
        message: e.message,
      };
    }
  }

  /** Withdraw an account in the middle of a boost run, null when there is nothing to withdraw */
  async withdrawBoosted({
    cloudAccount,
    runner,
    summary,
    index,
    total,
    walletAccount,
  }) {
    const { fmt, notify, options, token } = this.ctx;

    if (this.ctx.aborted) return null;

    const link = fmt.formatAccountLink(cloudAccount.id);
    const position = fmt.formatAccountPosition(index, total);

    /** Nothing to withdraw, so the history is not worth a request */
    if (!isWithdrawable(summary)) {
      return null;
    }

    const skip = async (reason) => {
      await notify.send([`⏩ Skipped <b>(${link})</b> - ${reason} ${position}`]);
      return { status: false, skipped: true, amount: "0" };
    };

    try {
      /** Both gates come from a single read of the withdraw history */
      const { pending, flagged } = await runner.getWithdrawalGuard();

      /** An account with a withdrawal in flight must not place another */
      if (pending && !options.ignorePending) {
        return await skip("a withdrawal is still pending");
      }

      /** Asking again is what puts a stale pending withdrawal back on the queue */
      if (pending) {
        await notify.send([
          `⏭️ Withdrawing <b>(${link})</b> anyway - a withdrawal is still pending ${position}`,
        ]);
      }

      /** The boost may have cost the account its standing, so this is read after it, not before */
      const protection = summary?.protection;

      const protectedBuyer = isProtectedBuyer(summary);

      if (protection && !protectedBuyer) {
        return await skip(
          protection.revoked
            ? "its buyer protection has been revoked"
            : "the drop counts no qualified DEX buy",
        );
      }

      /** A flagged history only sticks once protection is gone */
      if (flagged && !protectedBuyer) {
        return await skip("it has a flagged withdrawal");
      }

      /** Asking again while protection holds moves the flagged withdrawal back to pending */
      const unflagging = flagged && protectedBuyer;

      if (unflagging) {
        await notify.send([
          `♻️ Retrying <b>(${link})</b> - its flagged withdrawal can go back to pending while buyer protection holds ${position}`,
        ]);
      }

      logger.info("Withdrawing boosted account:", cloudAccount.id);

      /** The whole balance, unrandomized */
      const { status, skipped, message, amount } = await runner.withdraw({
        force: true,
        difference: 0,
      });

      logger.success(
        "Completed boost withdrawal:",
        cloudAccount.id,
        status,
        skipped,
        message,
        amount,
      );

      /** Refresh the summary to reflect the updated balance and any flags */
      const refreshedSummary = status
        ? await this.refreshWithdrawn(runner, cloudAccount)
        : null;

      /** The drop reviews the payout later, against whatever the account looks like then */
      const requalified = status
        ? await this.requalifyAfter({
            cloudAccount,
            runner,
            walletAccount,
            summary: refreshedSummary,
          })
        : null;

      const updatedSummary = requalified?.summary || refreshedSummary;

      await notify.send(
        [
          fmt.formatWithdrawalOutcome({
            label: link,
            status,
            skipped,
            amount,
            message,
            position,
            ...(unflagging
              ? { verb: "Unflagged", icon: "♻️", detail: " is pending again" }
              : {}),
          }),
        ]
          .concat(fmt.formatRequalifyOutcome(link, requalified))
          .concat(
            updatedSummary
              ? ["", ...fmt.formatSummaryDetails(updatedSummary)]
              : [],
          ),
      );

      return { status, skipped, message, amount };
    } catch (e) {
      if (this.ctx.aborted) return null;

      const errorMessage = e.message || "Unknown error!";

      logger.error("Failed to withdraw boosted account:", errorMessage);

      await notify.send([
        fmt.formatWithdrawalOutcome({
          label: link,
          status: false,
          message: errorMessage,
          position,
        }),
      ]);

      return {
        status: false,
        skipped: false,
        message: errorMessage,
        amount: "0",
      };
    }
  }

  /** Withdraw an account on its own, capped and randomized by the run settings */
  async request(cloudAccount) {
    const { options } = this.ctx;

    try {
      logger.info("Withdrawing account:", cloudAccount.id);

      const runner = await this.ctx.getRunner(cloudAccount);

      await this.ctx.delaySeconds(5);

      /** Claim whatever is pending so the full balance is withdrawable */
      await runner.refreshAutoState();

      await this.ctx.delaySeconds(5);

      const { status, skipped, amount, message } = await runner.withdraw({
        max: options.amount,
        difference: options.difference,
        force: true,
      });

      logger.success(
        "Completed withdrawal:",
        cloudAccount.id,
        status,
        skipped,
        message,
        amount,
      );

      /** Re-read and record the account to reflect the updated balance and any flags */
      await this.refreshWithdrawn(runner, cloudAccount);

      return { status, skipped, message, amount };
    } catch (e) {
      const errorMessage = e.message || "Unknown error!";

      logger.error(errorMessage);

      return {
        status: false,
        skipped: false,
        message: errorMessage,
        amount: "0",
      };
    }
  }
}

export default AutoWithdrawer;
