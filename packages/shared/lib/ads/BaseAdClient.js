import axios from "axios";

import { delayForSeconds } from "../../utils/delay.js";

/** Shared context for the ad clients, so they run anywhere with just an api and initData */
export default class BaseAdClient {
  /**
   * @param {object} [options]
   * @param {import("axios").AxiosInstance} [options.api] - HTTP client, defaults to a fresh axios instance
   * @param {string} [options.initData] - raw Telegram initData
   * @param {string} [options.origin] - the mini app's origin, e.g. `https://app.example.com`
   * @param {string} [options.launchURL] - the mini app's launch URL, defaults to `origin`
   * @param {string} [options.userAgent] - user agent to report where a network asks for it
   * @param {{get: Function, set: Function}} [options.storage] - optional persistence for device ids and regions
   * @param {{log: Function}} [options.logger] - optional console-like logger
   * @param {AbortSignal|(() => AbortSignal)} [options.signal] - abort signal, or a getter read on each wait
   */
  constructor(options = {}) {
    /** The shared keys only, so a client can hand them to the clients it builds */
    this.context = {
      api: options.api,
      initData: options.initData,
      origin: options.origin,
      launchURL: options.launchURL,
      userAgent: options.userAgent,
      storage: options.storage,
      logger: options.logger,
      signal: options.signal,
    };

    this.api = options.api || axios.create();
    this.initData = options.initData || "";
    this.origin = options.origin || "";
    this.launchURL = options.launchURL || this.origin;
    this.userAgent = options.userAgent;
    this.storage = options.storage;
    this.logger = options.logger;

    this.user = this.parseUser();
  }

  /** The abort signal, read late so a cached client follows each run */
  get signal() {
    const signal = this.context.signal;
    return typeof signal === "function" ? signal() : signal;
  }

  /** The Telegram user's id */
  get userId() {
    return this.user?.id;
  }

  /** The `start_param` the mini app was opened with */
  get startParam() {
    return new URLSearchParams(this.initData).get("start_param") || undefined;
  }

  /** The Telegram user's language, `en` when unknown */
  get languageCode() {
    return this.user?.["language_code"] || "en";
  }

  /** Parse the Telegram user out of initData */
  parseUser() {
    try {
      const user = new URLSearchParams(this.initData).get("user");
      return user ? JSON.parse(user) : undefined;
    } catch {
      return undefined;
    }
  }

  /** Log through the optional logger */
  log(...args) {
    this.logger?.log?.(...args);
  }

  /** Wait on the abort signal */
  wait(seconds) {
    if (seconds <= 0) return;

    return delayForSeconds(seconds, { signal: this.signal });
  }
}
