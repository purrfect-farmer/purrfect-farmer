import * as changeKeys from "change-case/keys";

import seedrandom from "seedrandom";

/** Who the farmer runs as, read from the Telegram web app it was launched with */
export default class TelegramIdentity {
  /**
   * @param {object} options
   * @param {() => { initData?: string, initDataUnsafe?: object } | undefined} options.webApp - the Telegram web app at call time
   * @param {() => Function} options.drop - the farmer class, for its launch URL
   * @param {() => string|undefined} options.startParam - the start parameter of the farmer's own link
   * @param {() => string} options.fallbackLink - the link launched with when there is no initData
   */
  constructor({ webApp, drop, startParam, fallbackLink }) {
    this.webApp = webApp;
    this.drop = drop;
    this.linkStartParam = startParam;
    this.fallbackLink = fallbackLink;
  }

  /** Get Init Data */
  initData() {
    return this.webApp()?.initData;
  }

  /** Get Init Data Unsafe */
  initDataUnsafe(camelCase = false) {
    return camelCase
      ? changeKeys.camelCase(this.webApp()?.initDataUnsafe, Infinity)
      : this.webApp()?.initDataUnsafe;
  }

  /** Get Init Data Hash */
  initDataHash() {
    return this.initDataUnsafe()?.hash;
  }

  /** Get Telegram User */
  user() {
    return this.initDataUnsafe()?.user;
  }

  /** Get User ID */
  userId() {
    return this.user()?.id;
  }

  /** Get Username */
  username() {
    return this.user()?.username;
  }

  /** Get User First Name */
  firstName() {
    return this.user()?.["first_name"] || "";
  }

  /** Get User Last Name */
  lastName() {
    return this.user()?.["last_name"] || "";
  }

  /** Get User Full Name */
  fullName() {
    return `${this.firstName()} ${this.lastName()}`.trim();
  }

  /** Get Profile Photo URL */
  photoUrl() {
    return this.user()?.["photo_url"] || null;
  }

  /** Get Is Premium User */
  isPremium() {
    return this.initDataUnsafe()?.["is_premium"] || false;
  }

  /** Get Start Parameter */
  startParam() {
    return this.initDataUnsafe()?.["start_param"];
  }

  /** The referral the account launched with, read the way the pages read it */
  referrerStartParam() {
    return this.startParam() || this.linkStartParam() || "";
  }

  /** The URL the mini app opens at, from initData when there is one */
  launchURL() {
    const initData = this.initData();

    return initData
      ? this.drop().getUrlFromInitData(initData)
      : this.fallbackLink();
  }

  /** Get User Random Generator */
  randomGenerator() {
    return seedrandom(this.userId());
  }

  /** Get Fixed Random Number */
  fixedRandomNumber() {
    return this.randomGenerator()();
  }
}
