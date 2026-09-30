import Decimal from "decimal.js";
import AutoOperation from "./AutoOperation.js";
import logger from "../../logger.js";
import { CULTIVATE_OWNER, LAST_FUNDER_KEY } from "../constants.js";
import { didWithdraw } from "../summary.js";
import { getVault } from "../../AutoVault.js";
import { orderByFunder } from "../rollChain.js";

/** Boost and withdraw loaded accounts on a timer until cancelled */
class CultivateOperation extends AutoOperation {
  /** Boost and withdraw on a timer until cancelled */
  run() {
    const { ctx, fmt, options } = this;

    return ctx.runLoop({
      intro: [
        `⏳ ${this.title} - Cultivation started...`,
        ...fmt.formatSettings(
          "cultivateInterval",
          "delay",
          "difference",
          "amount",
          "reuseLastAmount",
          "includeFrozen",
          "includeRevoked",
          "requalify",
          "ignorePending",
          "freeze",
          "runFarmer",
        ),
        fmt.formatLoadedWallets(),
      ],
      cycle: () => this.runCycle(),
      interval: options.cultivateInterval,
      errorLabel: "a cultivate cycle",
      stopped: `🛑 ${this.title} - Cultivation stopped.`,
    });
  }

  /** The loaded accounts a cultivate cycle may boost, read from the stored snapshots */
  async getCandidates(vault, helperIds) {
    const { ctx, options } = this;

    const sorted = await ctx.records.scanCandidates({
      vault,
      excludeIds: helperIds,
      allowFrozen: options.includeFrozen,
      accept: ({ row, account, snapshot }) => {
        /** An account the drop has stripped of buyer protection is not worth boosting */
        if (snapshot.protection?.revoked && !options.includeRevoked) {
          return "protection revoked";
        }

        /** Stale by definition, so this only spares a login when a helper is plainly mid-exchange */
        if (snapshot.wallet?.address !== account.address) {
          return "not on its own wallet";
        }

        /** The assist loop is already working this account */
        const holder = ctx.holder(String(row.account.id));

        if (holder) return `${holder}ing`;

        return {
          account,
          snapshot,
          lastFunder: row.storage?.[LAST_FUNDER_KEY]?.address || null,
        };
      },
    });

    /** Collecting always sends from the master, so only a rolling chain reorders */
    if (ctx.masterWallet.mode !== "roll") return sorted;

    /** The cycle re-reads the real master, so that is where the chain starts */
    return orderByFunder(
      sorted,
      (candidate) => candidate.lastFunder,
      ctx.master.address,
      (candidate) => candidate.account,
    );
  }

  /** Boost one account, then withdraw it once the drop has settled the boost */
  async processCultivate(account, index, total, { requalifying = false } = {}) {
    const { ctx } = this;

    const cloudAccount = await ctx.getCloudAccount(
      account,
      this.options.includeFrozen,
    );

    if (!cloudAccount) return null;

    /** A leaked runner would keep the account out of farming until the loop stops */
    try {
      return await ctx.boostStep.boostAccount({
        account,
        cloudAccount,
        index,
        total,
        requalifying,
        withdraw: !requalifying,
        reportBelowMinimum: true,
      });
    } finally {
      ctx.releaseRunner(cloudAccount);
    }
  }

  /** One pass over everyone worth boosting and withdrawing */
  async runCycle() {
    const { ctx, fmt } = this;
    const vault = getVault(ctx.autoId);

    if (!vault) {
      await this.notify.send([
        `⚠️ ${this.title} - no wallets are loaded on this server. Run Load first.`,
      ]);
      return [];
    }

    const helperIds = new Set(
      [...vault.accounts.values()]
        .filter((account) => account.verified)
        .map((account) => String(account.userId)),
    );

    const candidates = await this.getCandidates(vault, helperIds);

    if (!candidates.length) {
      await this.notify.send([
        `⏩ ${this.title} - no account is free to be boosted.`,
      ]);
      return [];
    }

    /** The master rolls forward through the accounts, so it is re-read every cycle */
    await ctx.masterWallet.prepareInitial();

    /** An empty master still connects every wallet, which is what re-reads the account */
    if (ctx.masterWallet.isEmpty()) {
      await this.notify.send([
        `<i>🟡 ${this.title} - Master has no ${this.token}. Connecting wallets without boosting...</i>`,
      ]);
    }

    await this.notify.send(fmt.formatCandidateQueue(candidates));

    const results = [];

    /** Withdrawing spends an account's DEX buyer standing, so it goes round again */
    const withdrawn = [];

    try {
      for (const [index, candidate] of candidates.entries()) {
        if (ctx.aborted) break;

        const { userId } = candidate.account;

        /** The assist loop may have taken this account since the queue was built */
        if (!ctx.claim(userId, CULTIVATE_OWNER)) continue;

        try {
          const result = await this.processCultivate(
            candidate.account,
            index,
            candidates.length,
          );

          if (result) results.push(result);

          if (didWithdraw(result)) withdrawn.push(candidate.account);
        } catch (error) {
          if (ctx.aborted) break;

          const errorMessage = error.message || "Unknown error!";
          logger.error(errorMessage);

          results.push({
            status: false,
            skipped: false,
            settled: false,
            boosted: new Decimal(0),
            withdrawal: null,
          });

          await this.notify.send([
            `❌ Failed to cultivate <b>(${fmt.formatAccountLink(userId)})</b>`,
            `<i>Error: ${errorMessage}</i>`,
          ]);
        } finally {
          ctx.release(userId, CULTIVATE_OWNER);
        }

        if (index < candidates.length - 1) {
          await ctx.delaySafeMinutes();
        }
      }

      await ctx.boostStep.runRequalifyPass(
        withdrawn,
        async (account, index, total) => {
          /** The assist loop may have taken this account since the withdrawal */
          if (!ctx.claim(account.userId, CULTIVATE_OWNER)) return false;

          try {
            await this.processCultivate(account, index, total, {
              requalifying: true,
            });
          } finally {
            ctx.release(account.userId, CULTIVATE_OWNER);
          }
        },
      );
    } finally {
      /** Rolling leaves the balance on the last account, so it is walked back */
      if (ctx.masterWallet.masterData) {
        await ctx.masterWallet.returnFunds().catch((error) =>
          logger.error(
            "Failed to return funds to master:",
            error.message || "Unknown error!",
          ),
        );
      }
    }

    await this.notify.sendBoostSummary(results);

    return results;
  }
}

export default CultivateOperation;
