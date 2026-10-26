import FarmerModule from "../../lib/farmer/FarmerModule.js";
import {
  DEFAULT_WEB_APP_PLATFORM,
  DEFAULT_WEB_APP_VERSION,
} from "../../utils/telegram.js";
import { API_URL, HEADER } from "./constants.js";

/** The drop's API: its transport and one method per endpoint */
export default class PickaxeApi extends FarmerModule {
  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** The install id the page keeps on the phone, seeded by the user so it stays the same across runs */
  #installId = null;

  /** The page's install id: 16 random bytes as hex */
  installId() {
    if (!this.#installId) {
      const random = this.core.userRandom();

      this.#installId = Array.from({ length: 32 }, () =>
        Math.floor(random() * 16).toString(16),
      ).join("");
    }

    return this.#installId;
  }

  /** The Telegram platform and version, as the page reports them */
  platform() {
    const webApp = this.core.telegramWebApp;
    const platform = webApp?.platform || DEFAULT_WEB_APP_PLATFORM;
    const version = webApp?.version || DEFAULT_WEB_APP_VERSION;

    return `${platform} ${version}`.slice(0, 40);
  }

  /** Carry `initData` on every call the drop's own API receives, plus the install and platform on actions */
  configure() {
    const interceptor = this.api.interceptors.request.use((config) => {
      if (String(config.url || "").startsWith(API_URL)) {
        config.headers[HEADER.INIT_DATA] = this.core.initData();

        if (config.method === "post") {
          config.headers[HEADER.INSTALL_ID] = this.installId();
          config.headers[HEADER.PLATFORM] = this.platform();
        }
      }

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(interceptor);
    };
  }

  /** Call the drop's API, returning its body and throwing a refusal with its code */
  async callApi(method, path, data) {
    const response = await this.api.request({
      method,
      url: `${API_URL}${path}`,
      data: method === "post" ? data || {} : undefined,
      signal: this.signal,
      validateStatus: () => true,
    });

    const payload = response.data;

    if (!payload || typeof payload !== "object") {
      throw new Error(`Request failed (${response.status})`);
    }

    if (response.status < 200 || response.status >= 300) {
      const error = new Error(
        payload["error"] || `Request failed (${response.status})`,
      );

      error.code = payload["code"] || null;
      error.status = response.status;
      throw error;
    }

    return payload;
  }

  /** Read from the drop's API */
  get(path) {
    return this.callApi("get", path);
  }

  /** Act on the drop's API */
  post(path, data) {
    return this.callApi("post", path, data);
  }

  /* --------------------------------------------------------------------- */
  /* Account                                                               */
  /* --------------------------------------------------------------------- */

  /** The drop's public settings: token, bot and withdrawal minimum */
  fetchConfig() {
    return this.get("/config");
  }

  /** The account's state, registering it on first open */
  fetchMe() {
    return this.post("/me");
  }

  /** A single-use payload for a TON proof */
  fetchProofPayload() {
    return this.get("/ton-proof/payload").then((result) => result["payload"]);
  }

  /** Link a wallet with its signed TON proof */
  connectWallet({ address, proof, stateInit, publicKey }) {
    return this.post("/wallet/connect", {
      address,
      proof,
      stateInit,
      publicKey,
    });
  }

  /** Unlink the account's wallet */
  disconnectWallet() {
    return this.post("/wallet/disconnect");
  }

  /* --------------------------------------------------------------------- */
  /* Ancient Pass                                                          */
  /* --------------------------------------------------------------------- */

  /** Order the pass, returning the state with the TonConnect transaction that pays for it */
  orderPass() {
    return this.post("/pass/order");
  }

  /** Have the drop look for the pass payment */
  checkPass() {
    return this.post("/pass/check");
  }

  /* --------------------------------------------------------------------- */
  /* Mining, check-in and tasks                                            */
  /* --------------------------------------------------------------------- */

  /** Claim what the storage holds */
  claimMining() {
    return this.post("/claim");
  }

  /** Claim today's check-in */
  checkIn() {
    return this.post("/checkin");
  }

  /** Start a task, which opens its check */
  startTask(taskId) {
    return this.post(`/tasks/${encodeURIComponent(taskId)}/start`);
  }

  /** Claim a task whose check has passed */
  claimTask(taskId) {
    return this.post(`/tasks/${encodeURIComponent(taskId)}/claim`);
  }

  /* --------------------------------------------------------------------- */
  /* Friends and history                                                   */
  /* --------------------------------------------------------------------- */

  /** The friends the account has invited */
  fetchReferrals() {
    return this.post("/referrals").then((result) => result["friends"] || []);
  }

  /** Claim the share the friends have earned the account */
  claimReferrals() {
    return this.post("/referrals/claim");
  }

  /* --------------------------------------------------------------------- */
  /* Withdrawals                                                           */
  /* --------------------------------------------------------------------- */

  /** Request a withdrawal to the linked wallet */
  requestWithdrawal({ amount, formMs }) {
    return this.post("/withdraw", { amount, formMs, bot: false });
  }
}
