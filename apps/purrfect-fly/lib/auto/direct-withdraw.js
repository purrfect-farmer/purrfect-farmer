import { ASSIST_OWNER } from "./constants.js";
import logger from "../logger.js";
import { failedWithdrawal } from "./summary.js";

/** Withdraw a trusted account's own pool, with no wallet changing hands */
export async function withdrawDirectly(ctx, candidate) {
  const { fmt, notify } = ctx;
  const { account } = candidate;
  const label = fmt.formatAccountLink(account.userId);

  /** The cultivate loop may already be boosting this account */
  if (!ctx.claim(account.userId, ASSIST_OWNER)) return null;

  let entry = null;

  try {
    entry = await ctx.helpers.getRunnerFor(account);

    if (!entry) return null;

    /** Never withdraw from a wallet that is mid-exchange elsewhere */
    if (!ctx.helpers.holdsOwnWallet(entry.runner, account)) {
      await notify.send([
        `⚠️ Skipped <b>(${label})</b> - it is not on its own wallet. Is it loaded on another server?`,
      ]);
      return null;
    }

    /** An account with a withdrawal in flight must not place another */
    if (await entry.runner.hasPendingWithdrawal()) {
      await notify.send([
        `⏩ Skipped <b>(${label})</b> - a withdrawal is still pending.`,
      ]);
      return null;
    }

    const { status, skipped, ...withdrawal } = await entry.runner.withdraw({
      force: true,
      difference: 0,
    });

    const amount = withdrawal.amount ?? "0";
    const message = withdrawal.message ?? "";

    /** Keep the next cycle from re-picking an account just drained */
    await entry.runner.storeAutoSnapshot();

    await notify.sendAdmin([
      fmt.formatWithdrawalOutcome({
        label,
        status,
        skipped,
        amount,
        message,
        detail: skipped ? "" : " directly",
      }),
    ]);

    return { status, skipped, amount, message };
  } catch (error) {
    if (ctx.aborted) return null;

    const errorMessage = error.message || "Unknown error!";
    logger.error(errorMessage);

    await notify.send([
      fmt.formatWithdrawalOutcome({
        label,
        status: false,
        message: errorMessage,
        detail: " directly",
      }),
    ]);

    return failedWithdrawal(errorMessage);
  } finally {
    if (entry) ctx.releaseRunner(entry.cloudAccount);
    ctx.release(account.userId, ASSIST_OWNER);
  }
}
