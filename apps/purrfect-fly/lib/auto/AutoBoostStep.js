import Decimal from "decimal.js";
import logger from "../logger.js";
import { didWithdraw } from "./summary.js";
import { orderByFunder } from "./rollChain.js";
import { MASTER_MODE } from "../../enums/master-mode.js";
import { REQUALIFY_STRATEGY } from "../../enums/requalify-strategy.js";
import { otherWalletVersion } from "./wallet-version.js";

/** Boosting one account, shared by the boost run and the cultivate loop, and the requalifying pass after either */
class AutoBoostStep {
  /** @param {import("./AutoContext.js").default} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** Order accounts so nobody is funded by the wallet that funded them last time */
  async orderAccounts(accounts, startAddress) {
    const lastFunders = await this.ctx.records.getLastFunders(accounts);

    if (!lastFunders.size) return accounts;

    return orderByFunder(
      accounts,
      (account) => lastFunders.get(String(account.userId)),
      startAddress,
    );
  }

  /** Boost one account, connect and settle it, then optionally withdraw or flip it, and roll the master on
   * @param {object} params
   * @param {object} params.account - the vault account
   * @param {object} params.cloudAccount - the farmed account behind it
   * @param {number} params.index - its place in the pass
   * @param {number} [params.total] - the pass size, the whole run when left out
   * @param {boolean} [params.requalifying] - a pass that boosts to win the standing back, not to grow the pool
   * @param {boolean} [params.withdraw] - whether to withdraw once the boost has settled
   * @param {boolean} [params.flip] - whether to flip the account onto its other wallet afterwards
   * @param {boolean} [params.onlyConnect] - connect the wallet without sending anything
   * @param {boolean} [params.reportBelowMinimum] - say so when the account was too poor to withdraw
   */
  async boostAccount({
    account,
    cloudAccount,
    index,
    total,
    requalifying = false,
    withdraw = false,
    flip = false,
    onlyConnect = false,
    reportBelowMinimum = false,
  }) {
    const { fmt, notify, records, options, masterWallet } = this.ctx;

    logger.info("Decrypting wallet phrase:", account.address);
    const phrase = await this.ctx.decryptPhrase(account.encryptedPhrase);
    logger.success("Successfully decrypted wallet phrase:", account.address);

    const walletAccount = { ...account, phrase };
    const booster = masterWallet.createBooster(walletAccount);

    /** Read before rolling moves the master on */
    const funderAddress = masterWallet.masterData.address;

    logger.info(
      onlyConnect ? "Connecting account:" : "Boosting account:",
      cloudAccount.id,
      account.address,
    );

    /** Connect-only runs never send, so they take the same path as an empty master */
    const { jettonAmount, skipped } = onlyConnect
      ? { jettonAmount: new Decimal(0), skipped: true }
      : await booster.boost({
          difference: options.difference,
          amount: records.boostAmountFor(cloudAccount),
          max: options.amount,
        });

    logger.success(
      skipped
        ? onlyConnect
          ? "Not boosting, only connecting:"
          : "Nothing to boost account with:"
        : "Successfully boosted account:",
      cloudAccount.id,
      account.address,
    );

    /** Give the transfer time to land. Nothing is in flight when skipped */
    if (!skipped) {
      await this.ctx.delaySeconds(3);
    }

    /** Connecting is also what waits the boost out and starts mining on it */
    const { status, message, summary, settled, runner } =
      await this.ctx.wallet.connect({
        cloudAccount,
        walletAccount,
        jettonAmount,
      });

    const link = fmt.formatAccountLink(cloudAccount.id);
    const position = fmt.formatAccountPosition(index, total);

    await this.notifyBoost({
      link,
      position,
      status,
      message,
      skipped,
      settled,
      jettonAmount,
      funderAddress,
      onlyConnect,
      requalifying,
      /** The payout record is read here, since the snapshot is only stored after any withdrawal */
      summary: status
        ? await records.withWithdrawalRecord(runner, summary)
        : summary,
    });

    /** An unsettled boost is left alone rather than withdrawn */
    let withdrawal = null;

    if (withdraw && status && settled) {
      withdrawal = await this.ctx.withdrawer.withdrawBoosted({
        cloudAccount,
        runner,
        summary,
        index,
        total,
        walletAccount,
      });

      /** The withdrawal path stays quiet about this */
      if (!withdrawal && reportBelowMinimum) {
        await notify.send([
          `⏩ Skipped <b>(${link})</b> - below the minimum ${position}`,
        ]);
      }
    }

    /** A withdrawn account boosted again by the requalify pass flips there instead */
    const requalifiesLater =
      didWithdraw({ withdrawal }) &&
      options.requalify === REQUALIFY_STRATEGY.BOOST &&
      masterWallet.mode === MASTER_MODE.ROLL;

    /** Only a boost that settled leaves anything worth flipping away from */
    const shouldFlip =
      Boolean(flip && runner && status && settled && !skipped) &&
      !requalifiesLater;

    let flipped = false;

    /** Snapshot the account, and remember who sent it these tokens */
    if (runner) {
      if (!skipped) {
        await records.recordLastFunder(runner, cloudAccount, funderAddress);
        await records.recordLastBoostAmount(runner, cloudAccount, jettonAmount);
      }

      if (shouldFlip) {
        flipped = await this.flipBoosted({
          runner,
          cloudAccount,
          account,
          phrase,
          link,
          position,
        });
      }

      /** A flip already stored the snapshot on its new wallet */
      if (!flipped) {
        await records.storeSnapshot(runner, cloudAccount);
      }
    }

    await this.ctx.delaySeconds(2);

    /** Rolling needs tokens to send, while collecting guards itself and still runs */
    if (!skipped || masterWallet.mode !== MASTER_MODE.ROLL) {
      await masterWallet.applyMode(account, phrase, booster);
    }

    return {
      status,
      skipped: false,
      settled: Boolean(settled),
      /** What left the master, which is nothing when it had nothing to send */
      boosted: skipped ? new Decimal(0) : jettonAmount,
      withdrawal,
      flipped,
    };
  }

  /** The full snapshot is reported on every success, so the freeze is visible before it bites */
  notifyBoost({
    link,
    position,
    status,
    message,
    skipped,
    settled,
    jettonAmount,
    funderAddress,
    onlyConnect,
    requalifying,
    summary,
  }) {
    const { fmt, token } = this.ctx;

    const action = skipped ? "connect" : "boost";
    const verb = requalifying ? "Requalified" : "Boosted";
    const icon = requalifying ? "♻️" : "⚡";

    return this.ctx.notify.send(
      status
        ? [
            skipped
              ? onlyConnect
                ? `🔗 Connected <b>(${link})</b> ${position}`
                : `🔗 Connected <b>(${link})</b> - no ${token} in master to boost with ${position}`
              : settled
                ? `${icon} ${verb} <b>(${link})</b> with <i>${jettonAmount} ${token}</i> ${position}`
                : `⏳ ${verb} <b>(${link})</b> with <i>${jettonAmount} ${token}</i>, but the drop hasn't settled it yet ${position}`,
            "",
            ...(skipped ? [] : [fmt.formatFundedBy(funderAddress)]),
            ...fmt.formatSummaryDetails(summary),
          ]
        : [
            `❌ Failed to ${action} <b>(${link})</b>${skipped ? "" : ` with <i>${jettonAmount} ${token}</i>`} ${position}`,
            `<i>Error: ${message || "Unknown error!"}</i>`,
          ],
    );
  }

  /** Flip a boosted account onto its phrase's other contract version, never failing the boost */
  async flipBoosted({ runner, cloudAccount, account, phrase, link, position }) {
    const { fmt, notify } = this.ctx;
    const version = otherWalletVersion(account.version);

    try {
      logger.info("Flipping boosted account:", cloudAccount.id, `v${version}`);

      const address = await this.ctx.wallet.connectVersion(
        runner,
        phrase,
        version,
      );

      logger.success("Flipped boosted account:", cloudAccount.id, address);

      await notify.send([
        `🔁 Flipped <b>(${link})</b> - ${fmt.formatWallet({ address, version: `v${version}` })} ${position}`,
      ]);

      return true;
    } catch (e) {
      if (this.ctx.aborted) return false;

      const errorMessage = e.message || "Unknown error!";

      logger.error(
        "Failed to flip boosted account:",
        cloudAccount.id,
        errorMessage,
      );

      await notify.send([
        `❌ Failed to flip <b>(${link})</b> ${position}\n<i>Reason: ${errorMessage}</i>`,
      ]);

      return false;
    }
  }
}

export default AutoBoostStep;
