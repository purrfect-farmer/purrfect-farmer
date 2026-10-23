import bot from "../../lib/bot.js";
import db from "../../db/models/index.js";
import { BLOCKED_FARMER_STATUSES } from "../../enums/farmer-status.js";
import { PRIMARY_MISSING_REASON } from "../../enums/primary-missing-reason.js";

/** Tracks the primary account's referral link for one farmer */
export default class PrimaryLink {
  /** Resolved primary link */
  link = null;

  /** Whether the real link of the primary account is known */
  resolved = false;

  /** Last reason the admin was warned about */
  warning = null;

  constructor(Runner) {
    this.Runner = Runner;
  }

  /** Default link the primary account launches with before it resolves */
  get defaultLink() {
    const Runner = this.Runner;
    return Runner.platform === "telegram" ? Runner.telegramLink : Runner.link;
  }

  /** Get primary farmer link */
  get() {
    return this.link || this.defaultLink;
  }

  /** Whether the instance is the primary account and its link is still unresolved */
  isPending(instance) {
    return (
      !this.resolved && instance.account.id === this.Runner.primaryAccountId
    );
  }

  /** Update the primary farmer link from an instance */
  async update(instance) {
    const Runner = this.Runner;

    try {
      let referralLink = Runner.referralLinks.get(instance.account.id);

      if (!referralLink) {
        referralLink = await instance.getReferralLink();

        /** An empty link would leave others on the default link */
        if (!referralLink) throw new Error("Empty referral link");

        Runner.referralLinks.set(instance.account.id, referralLink);
      }

      /** Only the primary account resolves the link */
      if (!this.isPending(instance)) return;

      this.resolve(referralLink);
    } catch (e) {
      /** Log */
      Runner.logger.force(() => {
        Runner.logger.error(
          `${Runner.title} Farmer - failed to update primary farmer link:`,
          e,
        );
      });

      /** Others stay held until the link resolves */
      if (this.isPending(instance)) {
        await this.notifyMissing(PRIMARY_MISSING_REASON.UNRESOLVED);
      }
    }
  }

  /** Mark the primary farmer link as resolved */
  resolve(link) {
    const Runner = this.Runner;

    /** Update the primary farmer link */
    this.link = link;
    this.resolved = true;
    this.warning = null;

    /** Configure the primary farmer link */
    Runner.configurePrimaryLink(this.link);

    /** Log */
    Runner.logger.force(() =>
      Runner.logger.success(
        `${Runner.title} Farmer - updated primary farmer link:`,
        this.link,
      ),
    );
  }

  /** Resolve the link stored on the primary account's farmer, without launching it */
  async resolveFromDatabase() {
    const Runner = this.Runner;

    if (this.resolved || !Runner.primaryAccountId) return this.resolved;

    const farmer = await db.Farmer.findOne({
      where: { accountId: Runner.primaryAccountId, farmer: Runner.id },
    });

    if (farmer?.referralLink) {
      Runner.referralLinks.set(Runner.primaryAccountId, farmer.referralLink);
      this.resolve(farmer.referralLink);
    }

    return this.resolved;
  }

  /** Throw unless the primary farmer link is resolved */
  async ensure() {
    if (!(await this.resolveFromDatabase())) {
      throw new Error(
        `${this.Runner.title}: primary farmer link is not resolved yet`,
      );
    }
  }

  /** Explain why the primary account was left out of the run */
  async getMissingReason(accountsWithFarmer) {
    const Runner = this.Runner;

    if (!Runner.primaryAccountId) return PRIMARY_MISSING_REASON.NOT_CONFIGURED;

    const account = accountsWithFarmer.find(
      (acc) => acc.id === Runner.primaryAccountId,
    );

    /** The list only holds subscribed accounts */
    if (!account) {
      const stored = await db.Account.findByPk(Runner.primaryAccountId);
      return stored
        ? PRIMARY_MISSING_REASON.NO_SUBSCRIPTION
        : PRIMARY_MISSING_REASON.NOT_FOUND;
    }
    if (Runner.platform !== "telegram" && !account.farmer) {
      return PRIMARY_MISSING_REASON.NO_FARMER;
    }
    if (BLOCKED_FARMER_STATUSES.includes(account.farmer?.status)) {
      return account.farmer.status;
    }
    if (Runner.terminated.has(account.id))
      return PRIMARY_MISSING_REASON.TERMINATED;
    if (!account.farmingEnabled) return PRIMARY_MISSING_REASON.FARMING_DISABLED;

    return PRIMARY_MISSING_REASON.NOT_FOUND;
  }

  /** Notify that the primary account is not configured or not runnable */
  async notifyMissing(reason) {
    const Runner = this.Runner;
    const account = `primary account (<code>${Runner.primaryAccountId}</code>)`;
    const details = {
      [PRIMARY_MISSING_REASON.NOT_CONFIGURED]:
        "primary account is not configured",
      [PRIMARY_MISSING_REASON.NOT_FOUND]: `${account} not found on this server`,
      [PRIMARY_MISSING_REASON.NO_SUBSCRIPTION]: `${account} has no active subscription`,
      [PRIMARY_MISSING_REASON.NO_FARMER]: `${account} has no farmer`,
      [PRIMARY_MISSING_REASON.FROZEN]: `${account} farmer is frozen`,
      [PRIMARY_MISSING_REASON.BANNED]: `${account} farmer is banned`,
      [PRIMARY_MISSING_REASON.TERMINATED]: `${account} is terminated`,
      [PRIMARY_MISSING_REASON.FARMING_DISABLED]: `${account} has farming disabled`,
      [PRIMARY_MISSING_REASON.UNRESOLVED]: `${account} referral link could not be resolved`,
    };

    const messages = [
      `⚠️ <b>${Runner.title} Farmer</b>: ${details[reason]}`,
      `<i>No accounts will run until it resolves.</i>`,
    ];

    try {
      /** Group message replaces the previous one */
      await bot?.sendPrimaryAccountMissingMessage(Runner.id, messages);

      /** Admin is only messaged when the reason changes */
      if (this.warning !== reason) {
        this.warning = reason;
        await bot?.sendAdminMessage(messages);
      }
    } catch (error) {
      Runner.logger.error(
        "Failed to send primary account notification:",
        error,
      );
    }
  }
}
