import bot from "../../lib/bot.js";

/** Tracks the primary account's referral link for one farmer */
export default class PrimaryLink {
  /** Resolved or fallback link */
  link = null;

  /** Whether the real link of the primary account is known */
  resolved = false;

  /** Last reason the admin was warned about */
  warning = null;

  constructor(Runner) {
    this.Runner = Runner;
  }

  /** Default link used until the primary account resolves */
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
        Runner.referralLinks.set(instance.account.id, referralLink);
      }

      /** A real link may replace the default fallback */
      if (!this.isPending(instance)) return;

      /** Update the primary farmer link */
      this.link = referralLink;
      this.resolved = true;

      /** Configure the primary farmer link */
      Runner.configurePrimaryLink(this.link);

      /** Log */
      Runner.logger.force(() =>
        Runner.logger.success(
          `${Runner.title} Farmer - updated primary farmer link:`,
          this.link,
        ),
      );
    } catch (e) {
      /** Log */
      Runner.logger.force(() => {
        Runner.logger.error(
          `${Runner.title} Farmer - failed to update primary farmer link:`,
          e,
        );
      });

      /** Reset the primary farmer link */
      this.reset(instance);
    }
  }

  /** Fall back to the default link so the queue is unblocked */
  reset(instance) {
    if (!this.isPending(instance)) return;

    const Runner = this.Runner;

    /** Update link */
    this.link = this.defaultLink;

    /** Log */
    Runner.logger.force(() =>
      Runner.logger.warn(
        `${Runner.title} Farmer - configuring default farmer link:`,
        this.link,
      ),
    );
  }

  /** Explain why the primary account was left out of the run */
  getMissingReason(accountsWithFarmer) {
    const Runner = this.Runner;

    if (!Runner.primaryAccountId) return "not-configured";

    const account = accountsWithFarmer.find(
      (acc) => acc.id === Runner.primaryAccountId,
    );

    if (!account) return "not-found";
    if (Runner.platform !== "telegram" && !account.farmer) return "no-farmer";
    if (["frozen", "banned"].includes(account.farmer?.status)) {
      return account.farmer.status;
    }
    if (Runner.terminated.has(account.id)) return "terminated";
    if (!account.farmingEnabled) return "farming-disabled";

    return "not-found";
  }

  /** Notify that the primary account is not configured or not runnable */
  async notifyMissing(reason) {
    const Runner = this.Runner;
    const account = `primary account (<code>${Runner.primaryAccountId}</code>)`;
    const details = {
      "not-configured": "primary account is not configured",
      "not-found": `${account} not found or has no active subscription`,
      "no-farmer": `${account} has no farmer`,
      frozen: `${account} farmer is frozen`,
      banned: `${account} farmer is banned`,
      terminated: `${account} is terminated`,
      "farming-disabled": `${account} has farming disabled`,
    };

    const messages = [
      `⚠️ <b>${Runner.title} Farmer</b>: ${details[reason]}`,
      `<i>New accounts will not auto-start.</i>`,
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
