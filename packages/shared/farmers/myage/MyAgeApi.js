import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { API_URL, HEADER, SESSION_STATUS } from "./constants.js";

/** The drop's API: its transport and one method per endpoint */
export default class MyAgeApi extends FarmerModule {
  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` on every call the drop's own API receives */
  configure() {
    const interceptor = this.api.interceptors.request.use((config) => {
      if (String(config.url || "").startsWith(API_URL)) {
        config.headers[HEADER.AUTHORIZATION] = `tma ${this.core.initData()}`;
      }

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(interceptor);
    };
  }

  /** Call the drop's API once, returning its body and throwing a refusal with its status */
  async request(method, path, data, key) {
    const post = method === "post";

    /* Send the call, keeping every status for the checks below */
    const response = await this.api.request({
      method,
      url: `${API_URL}/${path}`,
      data: post ? data || {} : undefined,
      headers: post ? { [HEADER.IDEMPOTENCY_KEY]: key } : undefined,
      signal: this.signal,
      validateStatus: () => true,
    });

    const payload = response.data;
    const ok = response.status >= 200 && response.status < 300;

    /* A body that did not arrive whole is no answer */
    if (!payload || typeof payload !== "object") {
      const error = new Error(`Request failed (${response.status})`);

      error.status = ok ? 0 : response.status;
      throw error;
    }

    /* A refusal keeps its status and the drop's words */
    if (!ok) {
      const error = new Error(
        payload["error"] || `Request failed (${response.status})`,
      );

      error.status = response.status;
      error.data = payload;
      throw error;
    }

    return payload;
  }

  /** Call the drop's API, opening the session and repeating once when the account was not there yet */
  async callApi(method, path, data, key = crypto.randomUUID()) {
    try {
      return await this.request(method, path, data, key);
    } catch (error) {
      /* Only a reopen request is repeated, with the same key */
      const reopen =
        error.status === SESSION_STATUS.REOPEN && error.data?.["reopen"];

      if (!reopen) throw error;

      await this.ctx.state.load();

      return this.request(method, path, data, key);
    }
  }

  /** Read from the drop's API */
  get(path) {
    return this.callApi("get", path);
  }

  /** Act on the drop's API, under `key` when a repeat must replay the first answer */
  post(path, data = {}, key) {
    return this.callApi("post", path, data, key);
  }

  /* --------------------------------------------------------------------- */
  /* Account                                                               */
  /* --------------------------------------------------------------------- */

  /** The account's full state, opening the account on first call */
  openSession() {
    return this.request("post", "session", {}, crypto.randomUUID());
  }

  /** A single-use payload for a TON proof */
  fetchProofPayload() {
    return this.get("wallet").then((result) => result["payload"]);
  }

  /** Link a wallet with its signed TON proof */
  connectWallet({ address, stateInit, proof }) {
    return this.post("wallet", { address, stateInit, proof });
  }

  /** Unlink the account's wallet */
  disconnectWallet() {
    return this.post("wallet", { disconnect: true });
  }

  /* --------------------------------------------------------------------- */
  /* Rewards                                                               */
  /* --------------------------------------------------------------------- */

  /** Claim the one-time welcome reward for the account's age */
  claimWelcome() {
    return this.post("welcome");
  }

  /** Claim today's daily reward */
  claimDaily() {
    return this.post("daily");
  }

  /** Claim what the vault has filled with */
  claimVault() {
    return this.post("vault");
  }

  /** Spin the wheel once */
  spin() {
    return this.post("spin");
  }

  /** Spin the mystery wheel once */
  spinMystery() {
    return this.post("mystery");
  }

  /** Claim today's reward for the tag in the Telegram name */
  claimTag() {
    return this.post("tag");
  }

  /** Claim today's reward for the invite link in the Telegram bio */
  claimBio() {
    return this.post("bio");
  }

  /* --------------------------------------------------------------------- */
  /* Tasks                                                                 */
  /* --------------------------------------------------------------------- */

  /** The task board as the account sees it */
  fetchTasks() {
    return this.get("tasks").then((result) => result["tasks"] || []);
  }

  /** Press a task once, which checks or counts it */
  pressTask(taskId) {
    return this.post("tasks", { taskId });
  }

  /* --------------------------------------------------------------------- */
  /* Withdrawals                                                           */
  /* --------------------------------------------------------------------- */

  /** The account's withdrawals and the tasks a withdrawal needs */
  fetchWithdrawals() {
    return this.get("withdraw");
  }

  /** Request a GRAM withdrawal to the linked wallet, under `key` so a repeat replays the first answer */
  requestWithdrawal(gram, key) {
    return this.post("withdraw", { gram }, key);
  }
}
