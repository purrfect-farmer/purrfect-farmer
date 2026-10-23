import AutoOperation from "./AutoOperation.js";
import { ASSIST_OWNER } from "../constants.js";
import { getVault } from "../../AutoVault.js";
import { isTrusted, isWithdrawable } from "../summary.js";
import { withdrawDirectly } from "../direct-withdraw.js";
import { withdrawThroughHelper } from "../wallet-exchange.js";

/** Withdraw loaded accounts' pools through verified (or trusted) helpers, on a timer until cancelled */
class AssistOperation extends AutoOperation {
  /** Assist on a timer until cancelled */
  run() {
    const { ctx, fmt, options } = this;

    return ctx.runLoop({
      intro: [
        `⏳ ${this.title} - Assisted withdrawals started...`,
        ...fmt.formatSettings(
          "assistInterval",
          "trustedWithdrawDirectly",
          "trustedAssist",
          "delay",
        ),
        fmt.formatLoadedWallets(),
      ],
      cycle: () => this.runCycle(),
      interval: options.assistInterval,
      errorLabel: "an assist cycle",
      stopped: `🛑 ${this.title} - Assisted withdrawals stopped.`,
    });
  }

  /** The loaded accounts that have reached the minimum, fullest pool first, and the trusted ones */
  async getCandidates(vault, verifiedIds) {
    /** Trusted accounts in good standing, whether or not they have reached the minimum */
    const trusted = [];

    const candidates = await this.ctx.records.scanCandidates({
      vault,
      excludeIds: verifiedIds,
      allowFrozen: false,
      accept: ({ account, snapshot }) => {
        const trustedAccount = isTrusted(snapshot);

        if (trustedAccount) trusted.push(account);

        if (!isWithdrawable(snapshot)) return "below the minimum";

        return { account, snapshot, trusted: trustedAccount };
      },
    });

    return { candidates, trusted };
  }

  /** One pass over everyone waiting to be withdrawn for */
  async runCycle() {
    const { ctx, fmt, options } = this;
    const vault = getVault(ctx.autoId);

    if (!vault) {
      await this.notify.send([
        `⚠️ ${this.title} - no wallets are loaded on this server. Run Load first.`,
      ]);
      return [];
    }

    const verified = [...vault.accounts.values()].filter(
      (account) => account.verified,
    );

    const verifiedIds = new Set(
      verified.map((account) => String(account.userId)),
    );

    const { candidates, trusted } = await this.getCandidates(
      vault,
      verifiedIds,
    );

    /** Trusted accounts only join the pool when asked to */
    const helpers = options.trustedAssist ? [...verified, ...trusted] : verified;

    /** Trusted accounts withdraw for themselves when asked to */
    const direct = options.trustedWithdrawDirectly
      ? candidates.filter((candidate) => candidate.trusted)
      : [];

    /** A trusted account left out of both is assisted like any other, and a trusted helper never queues behind the pool */
    const queue = candidates.filter(
      (candidate) =>
        !candidate.trusted ||
        (!options.trustedWithdrawDirectly && !options.trustedAssist),
    );

    /** Withdrawals already in flight, which are worth a cycle even when nothing else is */
    const outstanding = await ctx.records.getOutstandingAssists(helpers);

    /** Nothing has reached the minimum and nothing is owed: wait for the next cycle quietly */
    if (!direct.length && !queue.length && !outstanding.size) {
      await this.notify.send([
        `⏩ ${this.title} - no account has reached the minimum.`,
      ]);
      return [];
    }

    if (!helpers.length && !direct.length) {
      await this.notify.send([
        `⚠️ ${this.title} - none of the loaded accounts can withdraw for the others.`,
      ]);
      return [];
    }

    const results = [];

    await ctx.helpers.withHelpers(helpers, async (runners) => {
      /** Own pools go first, so a trusted helper that withdraws for itself rests for the rest of the cycle */
      if (direct.length) {
        await this.notify.send([
          `⏳ ${this.title} - ${direct.length} trusted account(s) withdrawing directly...`,
        ]);
      }

      for (const [index, candidate] of direct.entries()) {
        if (ctx.aborted) break;

        const result = await withdrawDirectly(this.ctx, candidate);

        if (!result) continue;

        results.push(result);

        if (index < direct.length - 1 || queue.length) {
          await ctx.delaySafeMinutes();
        }
      }

      if (ctx.aborted) return;

      /** Reading the helpers is also what reports a settled withdrawal */
      const available = await ctx.helpers.getAvailable(
        helpers,
        runners,
        outstanding,
      );

      /** Nothing is left for a helper, so reconciling was this cycle's only job */
      if (!queue.length) {
        if (!direct.length) {
          await this.notify.send([
            `⏩ ${this.title} - no account has reached the minimum.`,
          ]);
        }
        return;
      }

      /** The order they will be worked through, the richest pool first */
      await this.notify.send(fmt.formatCandidateQueue(queue));

      if (!available.length) {
        await this.notify.send([
          `⏩ ${this.title} - no helper is free this cycle. ${queue.length} account(s) waiting.`,
        ]);
        return;
      }

      await this.notify.send([
        `⏳ ${this.title} - Assisting ${queue.length} account(s) through ${available.length} helper(s)...`,
      ]);

      await ctx.helpers.runPool({
        items: queue,
        available,
        runners,
        label: (candidate) => fmt.formatAccountLink(candidate.account.userId),
        requesterId: (candidate) => String(candidate.account.userId),
        attempt: (candidate, helper, helperEntry) =>
          this.assistCandidate(candidate, helper, helperEntry),
        scope: "cycle",
        leftOver: "left for the next cycle",
        results,
      });
    });

    return results;
  }

  /** Claim a requester, log it in, and withdraw it through the helper; null when it cannot be worked */
  async assistCandidate(candidate, helper, helperEntry) {
    const { ctx } = this;
    const { userId } = candidate.account;

    /** The cultivate loop may already be boosting this account */
    if (!ctx.claim(userId, ASSIST_OWNER)) return null;

    let requesterEntry = null;

    try {
      requesterEntry = await ctx.helpers.getRunnerFor(candidate.account);

      if (!requesterEntry) return null;

      return await withdrawThroughHelper(ctx, {
        requester: candidate.account,
        requesterRunner: requesterEntry.runner,
        helper,
        helperRunner: helperEntry.runner,
      });
    } finally {
      /** Back into the farming batches while the next account is handled */
      if (requesterEntry) ctx.releaseRunner(requesterEntry.cloudAccount);
      ctx.release(userId, ASSIST_OWNER);
    }
  }
}

export default AssistOperation;
