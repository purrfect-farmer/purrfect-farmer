import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { API_URL, INIT_DATA_HEADER } from "./constants.js";

/** The drop's API: its transport and one method per endpoint */
export default class LootVaultApi extends FarmerModule {
  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` on every call the drop's own API receives, and on no others */
  configure() {
    const interceptor = this.api.interceptors.request.use((config) => {
      if (String(config.url || "").startsWith(API_URL)) {
        config.headers[INIT_DATA_HEADER] = this.core.initData();
      }

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(interceptor);
    };
  }

  /** Call the drop's API, returning its `d` and throwing a refusal with its code */
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

    if (!payload["ok"]) {
      const code = payload["e"] || `http_${response.status}`;
      const error = new Error(payload["msg"] || code);

      error.code = code;
      error.status = response.status;
      throw error;
    }

    return payload["d"];
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

  /** Whether the account is registered, and whether the drop is up */
  fetchAuth() {
    return this.get("/a0");
  }

  /** Whether an address is free to register with */
  checkWallet(address) {
    return this.post("/wc3", { addr: address });
  }

  /** Register the account on a wallet, after a solved captcha */
  register({ ref, captchaToken, address }) {
    return this.post("/a1", {
      ref,
      captchaToken,
      addr: address,
      termsAccepted: true,
    });
  }

  /** Level, league, speed and the mining clock */
  fetchDashboard() {
    return this.get("/d2");
  }

  /** The app balance, the on-chain hold and the bound wallets */
  fetchBalances() {
    return this.get("/b7");
  }

  /** Bind a wallet to the account */
  connectWallet(address) {
    return this.post("/w6", { addr: address });
  }

  /** Unbind the account's wallet */
  disconnectWallet() {
    return this.post("/w7");
  }

  /* --------------------------------------------------------------------- */
  /* Captcha                                                               */
  /* --------------------------------------------------------------------- */

  /** A fresh captcha */
  fetchCaptcha() {
    return this.post("/cp1");
  }

  /** Answer a captcha for a single-use token */
  verifyCaptcha(answer) {
    return this.post("/cp2", answer);
  }

  /* --------------------------------------------------------------------- */
  /* Mining                                                                */
  /* --------------------------------------------------------------------- */

  /** What a collect would credit, audited against the on-chain hold */
  previewMining() {
    return this.get("/m4/preview");
  }

  /** Collect what has been mined */
  collectMining(captchaToken) {
    return this.post("/m4", { captchaToken });
  }

  /* --------------------------------------------------------------------- */
  /* Tasks and friends                                                     */
  /* --------------------------------------------------------------------- */

  /** The daily streak and the task board */
  fetchTasks() {
    return this.get("/tk1");
  }

  /** Claim today's streak day */
  claimStreak() {
    return this.post("/tk2/streak");
  }

  /** Start a task, which opens its check */
  startTask(taskId) {
    return this.post("/tk2/start", { taskId });
  }

  /** Claim a task whose check has passed */
  claimTask(taskId) {
    return this.post("/tk2/claim", { taskId });
  }

  /** The referral code and the friends it brought */
  fetchFriends() {
    return this.get("/f4");
  }

  /** Collect what the friends have earned the account */
  claimFriendsReward() {
    return this.post("/f5");
  }

  /* --------------------------------------------------------------------- */
  /* Tower                                                                 */
  /* --------------------------------------------------------------------- */

  /** The tower floors, their slots and the income accrued */
  fetchTower() {
    return this.get("/t1");
  }

  /** Collect the tower income */
  collectTower() {
    return this.post("/t2");
  }

  /** Install one part into a floor's slot */
  equipPart({ floor, slotType, itemId }) {
    return this.post("/t3", { floor, slotType, itemId });
  }

  /** The parts the account holds */
  fetchInventory() {
    return this.get("/t5");
  }

  /* --------------------------------------------------------------------- */
  /* Withdrawals                                                           */
  /* --------------------------------------------------------------------- */

  /** The withdrawal rules, cooldown, pending claim and history */
  fetchWithdrawals() {
    return this.get("/c7");
  }

  /** Request a withdrawal of whole LOOT */
  requestWithdrawal(amount) {
    return this.post("/c8", { amount });
  }
}
