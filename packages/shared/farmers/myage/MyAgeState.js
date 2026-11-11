import Decimal from "decimal.js";

import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { SESSION_STATUS } from "./constants.js";

/** The account as the drop last returned it */
export default class MyAgeState extends FarmerModule {
  /** The account's session, which holds every part of its state */
  data = null;

  /** The status a refused session answered with, or null when it opened */
  refusal = null;

  /** When the drop opens again, in milliseconds from the refusal, when it is closed */
  opensInMs = null;

  /** When `data` was read, on the local clock */
  readAt = 0;

  /** Re-read the account, reading a block or a closed drop as that state */
  async load() {
    try {
      this.apply(await this.ctx.api.openSession());
      this.refusal = null;
      this.opensInMs = null;
    } catch (error) {
      /* Only the statuses the page explains are states; anything else fails the run */
      if (!Object.values(SESSION_STATUS).includes(error.status)) throw error;

      this.data = null;
      this.refusal = error.status;
      this.opensInMs = error.data?.["opensInMs"] ?? null;
    }

    return this.data;
  }

  /** Keep the session the drop replied with */
  apply(data) {
    this.data = data;
    this.readAt = Date.now();

    return data;
  }

  /** Read the account once, for entry points that run without a full pass */
  async ensureLoaded() {
    if (!this.data && !this.refusal) {
      await this.load();
    }

    return this.data;
  }

  /** Whether the drop has blocked the account */
  isBlocked() {
    return this.refusal === SESSION_STATUS.BLOCKED;
  }

  /** Whether the account can be played right now */
  isPlayable() {
    return Boolean(this.data) && !this.refusal;
  }

  /** Why the account cannot be played, or null when it can */
  unplayableReason() {
    /* The refusals the page has its own screen for */
    switch (this.refusal) {
      case SESSION_STATUS.BLOCKED:
        return "The account is blocked.";
      case SESSION_STATUS.CLOSED:
        return "My Age is closed for now.";
      case SESSION_STATUS.UNAUTHORIZED:
        return "My Age refused the Telegram login.";
    }

    if (!this.data) return "The account could not be read.";

    return null;
  }

  /** The account's own part of the session */
  user() {
    return this.data?.["user"] || {};
  }

  /** The AGE points the account holds */
  points() {
    return Number(this.user()["points"]) || 0;
  }

  /** The GRAM balance, which withdrawals draw from */
  gram() {
    return new Decimal(this.user()["gram"] || 0);
  }

  /** The wallet address the drop has the account on, as it stores it */
  wallet() {
    return this.user()["wallet"] || null;
  }

  /** One part of the session, or an empty object when the drop sent none */
  part(name) {
    return this.data?.[name] || {};
  }

  /** Keep the AGE and GRAM balances an action replied with */
  applyBalances(result) {
    const user = this.user();

    /* Points come back on every claim */
    if (result?.["points"] !== null && result?.["points"] !== undefined) {
      user["points"] = result["points"];
    }

    /* GRAM comes back only when a claim paid some */
    if (
      result?.["gramBalance"] !== null &&
      result?.["gramBalance"] !== undefined
    ) {
      user["gram"] = result["gramBalance"];
    }
  }
}
