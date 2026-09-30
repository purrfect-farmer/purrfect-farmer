import AutoOperation from "./AutoOperation.js";
import logger from "../../logger.js";
import { ASSIST_OWNER } from "../constants.js";
import { generateMnemonicPhrase } from "@purrfect/shared/lib/auto/wallet.js";
import { getVault } from "../../AutoVault.js";
import { isTrusted, isWithdrawable } from "../summary.js";

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

        const result = await this.withdrawDirectly(candidate);

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

      return await this.assistWithdrawal({
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

  /** Withdraw a requester's pool through a helper account, passing the wallet along and putting it back */
  async assistWithdrawal({ requester, requesterRunner, helper, helperRunner }) {
    const { ctx } = this;
    const { wallet } = ctx;

    /** Never take a wallet from an account that is already mid-exchange */
    if (!ctx.helpers.holdsOwnWallet(requesterRunner, requester)) {
      return {
        status: false,
        skipped: true,
        amount: "0",
        message: "Not on its own wallet - is it loaded on another server?",
      };
    }

    /** Both phrases are decrypted up front, because a rollback needs them and nothing has moved yet */
    const requesterPhrase = await ctx.decryptPhrase(requester.encryptedPhrase);
    const helperPhrase = await ctx.decryptPhrase(helper.encryptedPhrase);
    const temporaryPhrase = await generateMnemonicPhrase();

    const connect = (runner, phrase, version, label) =>
      wallet.connectOrThrow(runner, { phrase, version }, `${label} failed`);

    let requesterMoved = false;
    let helperMoved = false;

    /** Best-effort return of both accounts to their own wallets */
    const rollback = async () => {
      if (helperMoved) {
        try {
          await connect(
            helperRunner,
            helperPhrase,
            helper.version,
            "helper restore",
          );
          helperMoved = false;
        } catch (error) {
          logger.error("Failed to restore helper wallet:", error.message);
        }
      }

      if (requesterMoved) {
        try {
          await connect(
            requesterRunner,
            requesterPhrase,
            requester.version,
            "requester restore",
          );
          requesterMoved = false;
        } catch (error) {
          logger.error("Failed to restore requester wallet:", error.message);
        }
      }

      return { requesterMoved, helperMoved };
    };

    try {
      /** The requester releases its wallet */
      await connect(
        requesterRunner,
        temporaryPhrase,
        requester.version,
        "requester park",
      );
      requesterMoved = true;

      /** The verified account picks it up */
      await connect(
        helperRunner,
        requesterPhrase,
        requester.version,
        "helper adopt",
      );
      helperMoved = true;

      /** A refusal here is an outcome, not a fault: restore both wallets the ordinary way and report it */
      const withdrawal = await helperRunner.withdraw({
        force: true,
        difference: 0,
      });

      await connect(
        helperRunner,
        helperPhrase,
        helper.version,
        "helper restore",
      );
      helperMoved = false;

      await connect(
        requesterRunner,
        requesterPhrase,
        requester.version,
        "requester restore",
      );
      requesterMoved = false;

      /** Keep the next cycle from re-picking an account just drained */
      await requesterRunner.storeAutoSnapshot();

      return withdrawal;
    } catch (error) {
      const stranded = await rollback();

      if (stranded.requesterMoved || stranded.helperMoved) {
        await this.notify.sendStrandedWallet({
          requester,
          helper,
          ...stranded,
        });
      }

      throw error;
    }
  }

  /** Withdraw a trusted account's own pool, with no wallet changing hands */
  async withdrawDirectly(candidate) {
    const { ctx, fmt } = this;
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
        await this.notify.send([
          `⚠️ Skipped <b>(${label})</b> - it is not on its own wallet. Is it loaded on another server?`,
        ]);
        return null;
      }

      /** An account with a withdrawal in flight must not place another */
      if (await entry.runner.hasPendingWithdrawal()) {
        await this.notify.send([
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

      await this.notify.sendAdmin([
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

      await this.notify.send([
        fmt.formatWithdrawalOutcome({
          label,
          status: false,
          message: errorMessage,
          detail: " directly",
        }),
      ]);

      return {
        status: false,
        skipped: false,
        amount: "0",
        message: errorMessage,
      };
    } finally {
      if (entry) ctx.releaseRunner(entry.cloudAccount);
      ctx.release(account.userId, ASSIST_OWNER);
    }
  }
}

export default AssistOperation;
