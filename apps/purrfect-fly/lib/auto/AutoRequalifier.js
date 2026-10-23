import { MASTER_MODE } from "../../enums/master-mode.js";
import { REQUALIFY_STRATEGY } from "../../enums/requalify-strategy.js";
import logger from "../logger.js";
import { orderByFunder } from "./rollChain.js";

/** The second boost pass that wins withdrawn accounts their DEX buyer standing back */
class AutoRequalifier {
  /** @param {import("./AutoContext.js").default} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** Whether a requalifying pass is worth running at all */
  canRequalify(accounts) {
    const { options, masterWallet } = this.ctx;

    return (
      options.requalify === REQUALIFY_STRATEGY.BOOST &&
      masterWallet.mode === MASTER_MODE.ROLL &&
      !options.onlyConnectWallet &&
      Boolean(masterWallet.masterData) &&
      accounts.length > 0
    );
  }

  /** Walk the pool back to the master before a requalifying pass, which makes the master
   * a sender again and is what lets a two account pool requalify both of them */
  async resetMasterForRequalify() {
    try {
      await this.ctx.masterWallet.returnFunds();
      await this.ctx.masterWallet.prepareInitial();
    } catch (e) {
      /** The pass still runs from wherever the pool is */
      logger.error(
        "Failed to return funds to master before requalifying:",
        e.message || "Unknown error!",
      );
    }
  }

  /** Announce a requalifying pass, listing it the way the queue is */
  announceRequalify(accounts) {
    const { fmt, title } = this.ctx;

    return this.ctx.notify.send([
      `♻️ ${title} - Requalifying ${accounts.length} withdrawn account(s)...`,
      ...fmt.formatPreviewList(accounts, (account, position) =>
        fmt.formatKeyValue(
          `${position + 1}. ${fmt.formatAccountLink(account.userId)}`,
          fmt.truncateAddress(account.address),
        ),
      ),
    ]);
  }

  /** Boost the withdrawn accounts once more, from senders that did not fund them this pass
   * @param {object[]} accounts - vault accounts that placed a withdrawal this pass
   * @param {(account: object, index: number, total: number) => Promise<any>} boostOne -
   *   boosts one of them; returning false means it was passed over
   */
  async run(accounts, boostOne) {
    const { fmt, notify } = this.ctx;

    if (this.ctx.aborted || !this.canRequalify(accounts)) return;

    await this.resetMasterForRequalify();

    const lastFunders = await this.ctx.records.getLastFunders(accounts);

    const ordered = orderByFunder(
      accounts,
      (account) => lastFunders.get(String(account.userId)),
      this.ctx.masterWallet.masterData.address,
    );

    await this.announceRequalify(ordered);

    for (const [index, account] of ordered.entries()) {
      if (this.ctx.aborted) break;

      try {
        const result = await boostOne(account, index, ordered.length);

        if (result === false) continue;
      } catch (error) {
        if (this.ctx.aborted) break;

        const errorMessage = error.message || "Unknown error!";

        logger.error(
          "Failed to requalify the withdrawn account:",
          account.userId,
          errorMessage,
        );

        await notify.send([
          `❌ Failed to requalify <b>(${fmt.formatAccountLink(account.userId)})</b>`,
          `<i>Error: ${errorMessage}</i>`,
        ]);
      }

      if (index < ordered.length - 1) {
        await this.ctx.delaySafeMinutes();
      }
    }
  }
}

export default AutoRequalifier;
