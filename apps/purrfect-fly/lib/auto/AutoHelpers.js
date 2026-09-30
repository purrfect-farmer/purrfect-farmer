import logger from "../logger.js";
import { ASSIST_OWNER } from "./constants.js";

/** The pool of accounts that withdraw on others' behalf, shared by the assist loop and a rescue */
class AutoHelpers {
  /** @param {import("./AutoContext.js").default} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** Build a prepared runner for a loaded account, if this server owns it */
  async getRunnerFor(account) {
    const cloudAccount = await this.ctx.getCloudAccount(account, true);

    if (!cloudAccount) return null;

    const runner = await this.ctx.getRunner(cloudAccount);

    return { runner, cloudAccount };
  }

  /** Whether the drop still has this account on the wallet it was loaded with */
  holdsOwnWallet(runner, account) {
    const wallet = runner.getAutoSummary()?.wallet;

    return Boolean(wallet && wallet.address === account.address);
  }

  /** Tell the admin the withdrawal a helper placed has been settled */
  async announceSettlement(helper, record) {
    const { fmt, title, token } = this.ctx;

    await this.ctx.notify.sendAdmin([
      `✅ ${title} - ${fmt.formatAccountLink(helper.userId)} is free again. The withdrawal it placed has settled.`,
      fmt.formatKeyValue("Requester", fmt.formatAccountLink(record.requesterId)),
      fmt.formatKeyValue("Amount", `${record.amount} ${token}`),
      fmt.formatKeyValue(
        "Placed",
        fmt.formatTimestamp(Number(record.placedAt) / 1000),
      ),
      fmt.formatKeyValue("Settled after", fmt.formatElapsed(record.placedAt)),
    ]);
  }

  /** The helper accounts that can take work right now, each logged in once into `runners` */
  async getAvailable(helpers, runners, outstanding = new Map()) {
    const { fmt, notify, records, token } = this.ctx;
    const available = [];

    for (const helper of helpers) {
      if (this.ctx.aborted) break;

      const label = fmt.formatAccountLink(helper.userId);
      const entry = await this.getRunnerFor(helper);

      if (!entry) {
        await notify.send([
          `⏩ Skipped <b>(${label})</b> - not farmed by this server.`,
        ]);
        continue;
      }

      runners.set(String(helper.userId), entry);

      /** What this account was last asked to withdraw for someone else */
      const record = outstanding.get(String(helper.userId));

      /** An account with a withdrawal in flight must not place another */
      if (await entry.runner.hasPendingWithdrawal()) {
        await notify.send([
          record
            ? `⏩ Skipped <b>(${label})</b> - still waiting on the <i>${record.amount} ${token}</i> it withdrew for ${fmt.formatAccountLink(record.requesterId)}, placed ${fmt.formatElapsed(record.placedAt)} ago.`
            : `⏩ Skipped <b>(${label})</b> - a withdrawal is still pending.`,
        ]);
        continue;
      }

      /** Free again, so whatever it was carrying has been settled */
      if (record) {
        await this.announceSettlement(helper, record);
        await records.recordLastHelped(entry.runner, helper, {
          ...record,
          settledAt: Date.now(),
        });
        await records.clearAssist(entry.runner, helper);
      }

      if (!this.holdsOwnWallet(entry.runner, helper)) {
        await notify.send([
          `⚠️ Skipped <b>(${label})</b> - it is not on its own wallet. Is it loaded on another server?`,
        ]);
        continue;
      }

      /** The cultivate loop may already be boosting this account */
      if (!this.ctx.claim(helper.userId, ASSIST_OWNER)) {
        await notify.send([
          `⏩ Skipped <b>(${label})</b> - it is being ${this.ctx.holder(helper.userId)}ed right now.`,
        ]);
        continue;
      }

      available.push(helper);
    }

    return available;
  }

  /** Run with a set of helpers, releasing their runners and claims however it ends */
  async withHelpers(helpers, run) {
    /** Runners are kept for the whole run so each helper logs in once */
    const runners = new Map();

    try {
      return await run(runners);
    } finally {
      for (const entry of runners.values()) {
        this.ctx.releaseRunner(entry.cloudAccount);
      }

      /** Helpers are held for the whole run, so they are freed together */
      for (const helper of helpers) {
        this.ctx.release(helper.userId, ASSIST_OWNER);
      }
    }
  }

  /** Work through requesters with a rotating pool of helpers, resting each one once it has a withdrawal in flight
   * @param {object} params
   * @param {any[]} params.items - the requesters, richest first
   * @param {object[]} params.available - the helpers free to work
   * @param {Map<string, { runner: object, cloudAccount: object }>} params.runners - each helper's runner
   * @param {(item: any) => string} params.label - how a requester reads in a message
   * @param {(item: any) => string} params.requesterId - what the settlement record names the requester by
   * @param {(item: any, helper: object, helperEntry: object) => Promise<object | null>} params.attempt -
   *   withdraws one requester through the helper; null means it was passed over without trying
   * @param {string} params.scope - what the run is called, e.g. "cycle"
   * @param {string} params.leftOver - what a pool running dry says about the rest, e.g. "left for the next cycle"
   * @param {object[]} params.results - where each outcome is pushed
   */
  async runPool({
    items,
    available,
    runners,
    label,
    requesterId,
    attempt,
    scope,
    leftOver,
    results,
  }) {
    const { fmt, notify, records, title } = this.ctx;

    /** The drop allows one withdrawal per account, so a helper is spent once its request goes through */
    const pool = [...available];
    let turn = 0;

    for (const [index, item] of items.entries()) {
      if (this.ctx.aborted) break;

      if (!pool.length) {
        await notify.send([
          `⏩ ${title} - every helper has a withdrawal in flight. ${items.length - index} account(s) ${leftOver}.`,
        ]);
        break;
      }

      const helper = pool[turn % pool.length];
      const helperEntry = runners.get(String(helper.userId));
      const itemLabel = label(item);

      /** Whether this helper is still free after the attempt */
      let spent = false;

      /** Kept out of the attempt, since the record written below outlives it */
      let amount = "0";
      let message = "";

      try {
        const outcome = await attempt(item, helper, helperEntry);

        /** Passed over, e.g. taken by the other loop */
        if (!outcome) continue;

        const { status, skipped, ...withdrawal } = outcome;

        amount = withdrawal.amount ?? "0";
        message = withdrawal.message ?? "";

        results.push({ status, skipped, amount, message });

        /** A placed request occupies the account until the drop settles it */
        spent = status && !skipped;

        await notify.sendAdmin([
          fmt.formatWithdrawalOutcome({
            label: itemLabel,
            status,
            skipped,
            amount,
            message,
            detail:
              status && !skipped
                ? ` through ${fmt.formatAccountLink(helper.userId)}`
                : "",
          }),
        ]);
      } catch (error) {
        if (this.ctx.aborted) break;

        const errorMessage = error.message || "Unknown error!";
        logger.error(errorMessage);

        message = errorMessage;

        results.push({
          status: false,
          skipped: false,
          amount: "0",
          message: errorMessage,
        });

        await notify.send([
          fmt.formatWithdrawalOutcome({
            label: itemLabel,
            status: false,
            message: errorMessage,
          }),
        ]);
      }

      /** A failure can still have left a request behind, so ask the drop rather than trust the outcome */
      if (!spent) {
        spent = await helperEntry.runner
          .hasPendingWithdrawal()
          .catch(() => false);
      }

      if (spent) {
        pool.splice(pool.indexOf(helper), 1);

        /** Remember who it went through, so the settlement can be reported when it lands */
        await records.recordAssist(helperEntry.runner, helper, {
          requesterId: requesterId(item),
          amount,
          message,
          placedAt: Date.now(),
        });

        await notify.send([
          `⏳ ${fmt.formatAccountLink(helper.userId)} has a withdrawal in flight - resting it for the rest of this ${scope}.`,
        ]);
      } else {
        turn += 1;
      }

      if (index < items.length - 1 && pool.length) {
        await this.ctx.delaySafeMinutes();
      }
    }
  }
}

export default AutoHelpers;
