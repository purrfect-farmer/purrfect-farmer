import AutoOperation from "./AutoOperation.js";
import { didWithdraw } from "../summary.js";

/** Boost every selected account from the master, optionally withdrawing, requalifying and repeating */
class BoostOperation extends AutoOperation {
  /** Boost */
  run() {
    const { ctx, options } = this;
    const { masterWallet } = ctx;

    return this.guard("while boosting", async () => {
      while (true) {
        if (ctx.aborted) break;

        await this.notify.send([
          `⏳ ${this.title} - Boost initiated...`,
          ...this.fmt.formatSettings(
            "accounts",
            "delay",
            "onlyConnectWallet",
            "difference",
            "amount",
            "reuseLastAmount",
            "withdrawAfterBoost",
            ...(options.withdrawAfterBoost
              ? ["requalify", "ignorePending"]
              : []),
            "retainFunds",
            ...(!options.onlyConnectWallet ? ["flipAfterBoost"] : []),
            "freeze",
            "runFarmer",
            "repeat",
            "repeatInterval",
          ),
        ]);

        /** A retained run keeps rolling from wherever the funds are, so only the first pass reads the real master */
        if (options.retainFunds && masterWallet.masterData) {
          await masterWallet.prepareCurrent();
        } else {
          await masterWallet.prepareInitial();
        }

        /** Nobody should be funded by the wallet that funded them last time */
        await this.orderAccountsForThisPass();

        /** An empty master still connects every wallet, which is what registers the account with the drop */
        if (options.onlyConnectWallet) {
          await this.notify.send([
            `<i>🔗 ${this.title} - Only connecting wallets, no ${this.token} will be sent...</i>`,
          ]);
        } else if (masterWallet.isEmpty()) {
          await this.notify.send([
            `<i>🟡 ${this.title} - Master has no ${this.token}. Connecting wallets without boosting...</i>`,
          ]);
        }

        /** Withdrawing spends an account's DEX buyer standing, so it goes round again */
        const withdrawn = [];

        const results = await this.processAccounts(async (account, index) => {
          const result = await this.processBoost(account, index);

          if (didWithdraw(result)) withdrawn.push(account);

          if (!result.skipped && !this.isLastAccount(index)) {
            await this.delayBetweenAccounts(index);
          }

          return result;
        });

        await ctx.boostStep.runRequalifyPass(withdrawn, (account, index, total) =>
          this.processBoost(account, index, { requalifying: true, total }),
        );

        /** Return funds to master, unless the run is set to leave them in the last account */
        if (!options.retainFunds) {
          await masterWallet.returnFunds();
        }

        await this.sendCompletion(`✅ ${this.title} - Boost completed.`);

        /** The summary reports what a cancelled pass did get through */
        await this.notify.sendBoostSummary(results);

        /** A cancelled pass does not repeat: the check at the top breaks the loop */
        if (ctx.aborted) continue;

        if (!options.repeat) break;

        const repeatTime = ctx.fmt.formatTimestamp(
          Date.now() / 1000 + options.repeatInterval * 60 * 60,
        );

        await this.notify.send([
          `<i>🔄 ${this.title} - Boosting again at ${repeatTime}</i>`,
        ]);

        await ctx.delayMinutes(options.repeatInterval * 60);
      }
    });
  }

  /** Boost one selected account, skipped when it cannot be reached */
  async processBoost(account, index, { requalifying = false, total } = {}) {
    const { ctx, options } = this;

    /** An account that never reaches the drop counts as skipped rather than failed */
    if (!account.userId) return { status: false, skipped: true };

    const cloudAccount = await ctx.getCloudAccount(account, true);

    if (!cloudAccount) return { status: false, skipped: true };

    return ctx.boostStep.boostAccount({
      account,
      cloudAccount,
      index,
      total,
      requalifying,
      withdraw: !requalifying && options.withdrawAfterBoost,
      flip: options.flipAfterBoost,
      onlyConnect: options.onlyConnectWallet,
    });
  }

  /** Reorder the selected accounts, starting from whoever holds the funds now */
  async orderAccountsForThisPass() {
    const { ctx } = this;

    /** Collecting always sends from the master, so only a rolling chain reorders */
    if (ctx.masterWallet.mode !== "roll" || ctx.accounts.length < 2) return;

    ctx.accounts = await ctx.boostStep.orderAccounts(
      ctx.accounts,
      ctx.masterWallet.masterData.address,
    );
  }

  /** Wait between accounts, bursting every so often when enabled */
  async delayBetweenAccounts(index) {
    const shouldBurst = false; // TODO: Make this dynamic

    if (shouldBurst && (index + 1) % 20 === 0) {
      await this.burst();
    } else {
      await this.ctx.delaySafeMinutes();
    }
  }

  /** Pause the run for a while with the funds back in the master */
  async burst() {
    const { ctx, options } = this;

    await this.notify.send([
      `<i>🟡 ${this.title} - Bursting boost operation for 20 minutes...</i>`,
    ]);

    /** Return funds to master, unless the run is set to keep them where they are */
    if (!options.retainFunds) {
      await ctx.masterWallet.returnFunds();
    }

    await ctx.delayMinutes(10);

    if (options.retainFunds) {
      await ctx.masterWallet.prepareCurrent();
    } else {
      await ctx.masterWallet.prepareInitial();
    }

    await this.notify.send([
      `<i>🟢 ${this.title} - Boost operation resumed!</i>`,
    ]);
  }
}

export default BoostOperation;
