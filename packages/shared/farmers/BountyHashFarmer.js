import BaseFarmer from "../lib/BaseFarmer.js";

export default class BountyHashFarmer extends BaseFarmer {
  static id = "bounty-hash";
  static title = "Bounty Hash";
  static emoji = "♊";
  static host = "bountyhash.dev";
  static domains = ["bountyhash.dev", "api.bountyhash.dev"];
  static telegramLink =
    "https://t.me/bounty_hash_bot/mining?startapp=1147265290";

  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static cookies = true;

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/bounty_hash_bot/mining?startapp=${this.getUserId()}`;
  }

  /** Configure API */
  configureApi() {
    /** Sign Request */
    const requestSignatureInterceptor = this.api.interceptors.request.use(
      async (config) => {
        const headers = await this.getSignatureHeaders();
        config.headers = {
          ...config.headers,
          ...headers,
        };

        return config;
      }
    );

    return () => {
      this.api.interceptors.request.eject(requestSignatureInterceptor);
    };
  }

  /** Get signature headers */
  async getSignatureHeaders() {
    const cookies = await this.getCookies({
      url: "https://bountyhash.dev",
    });

    const xsrf = decodeURIComponent(
      cookies.find((item) => item.name === "XSRF-TOKEN")?.value || ""
    );

    const headers = {
      ["origins"]: "https://bountyhash.dev",
      ["x-xsrf-token"]: xsrf,
    };

    headers["x-auth-id"] = this.getUserId();
    headers["App-Version"] = "2.1.3";

    const token = this._authData ? this._authData.token : "";

    if (token) {
      const userId = this.getUserId();
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = this.utils.uuid() + "-" + timestamp;
      const sign = this.getXsrfSign(xsrf, timestamp);

      const signature = this.utils.sha256(
        [timestamp, token, nonce, timestamp, sign].join(":")
      );

      headers["x-timestamp"] = timestamp;
      headers["x-nonce"] = nonce;
      headers["x-xsrf-sign"] = sign;
      headers["x-signature"] = signature;
    }

    return headers;
  }

  /** Get XSRF Sign */
  getXsrfSign(xsrf, timestamp) {
    const half = Math.floor(xsrf.length / 2);
    const first = xsrf.slice(0, half);
    const second = xsrf.slice(half);

    return this.utils.sha256(`${first}${timestamp}${second}`);
  }

  /** Fetch CSRF */
  async fetchCSRF() {
    return this.api.get("https://api.bountyhash.dev/sanctum/csrf-cookie");
  }

  /** Get Auth */
  async fetchAuth() {
    await this.fetchCSRF();
    const data = await this.api
      .post(
        "https://api.bountyhash.dev/api/auth/telegram",
        new URLSearchParams(this.getInitData())
      )
      .then((res) => res.data);

    this._authData = data;

    return data;
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: `Bearer ${data.token}`,
    };
  }

  /** Get User */
  getUser(signal = this.signal) {
    return this.api
      .get("https://api.bountyhash.dev/api/user/get", {
        signal,
      })
      .then((res) => res.data);
  }

  /** Get Inventory */
  getInventory(signal = this.signal) {
    return this.api
      .get("https://api.bountyhash.dev/api/inventory/get", {
        signal,
      })
      .then((res) => res.data);
  }

  /** Get Mining Info */
  getMiningInfo(signal = this.signal) {
    return this.api
      .get("https://api.bountyhash.dev/api/mining/info", {
        signal,
      })
      .then((res) => res.data);
  }

  /** Accept Policy */
  acceptPolicy(signal = this.signal) {
    return this.api
      .put(
        "https://api.bountyhash.dev/api/user/policy-accept",
        { accept: true },
        {
          signal,
        }
      )
      .then((res) => res.data);
  }

  completeTutorial(signal = this.signal) {
    return this.api
      .put("https://api.bountyhash.dev/api/user/tutorial", null, {
        signal,
      })
      .then((res) => res.data);
  }

  activateDemoMiner(signal = this.signal) {
    return this.api
      .put("https://api.bountyhash.dev/api/home/activated_demo", null, {
        signal,
      })
      .then((res) => res.data);
  }

  claimDailyBonus(signal = this.signal) {
    return this.api
      .put("https://api.bountyhash.dev/api/daily/claim", null, {
        signal,
      })
      .then((res) => res.data);
  }

  startMining(signal = this.signal) {
    return this.api
      .put("https://api.bountyhash.dev/api/mining/start", null, {
        signal,
      })
      .then((res) => res.data);
  }

  claimMining(signal = this.signal) {
    return this.api
      .put("https://api.bountyhash.dev/api/mining/claim", null, {
        signal,
      })
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const { user } = await this.getUser();

    this.logUserInfo(user);
    await this.executeTask("Skip Tutorial", () => this.skipTutorial(user));
    await this.executeTask("Collect Daily Bonus", () =>
      this.collectDailyBonus(user)
    );
    await this.executeTask("Mining", () => this.startOrClaimMining(user));
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
  }

  async watchAd(type, signal = this.signal) {
    const result = await this.api
      .get(`https://api.bountyhash.dev/api/ads/get/?type=${type}`)
      .then((res) => res.data);

    await this.utils.delayForSeconds(5, { signal });

    await this.api.put("https://api.bountyhash.dev/api/ads/update/", {
      ["duration_ms"]: 5000 + Math.floor(Math.random() * 3000),
      ["type"]: type,
      ["verify_token"]: result["verify_token"],
    });
  }

  async skipTutorial(user) {
    if (!user["is_policy"]) {
      await this.acceptPolicy();
      this.logger.success("Accepted Policy");
    }

    if (!user["is_tutorial"]) {
      await this.completeTutorial();
      this.logger.success("Completed Tutorial");
    }

    if (!user["is_demo"]) {
      await this.activateDemoMiner();
      this.logger.success("Activated demo miner");
    }
  }

  async collectDailyBonus(user) {
    if (
      !user["daily_last_at"] ||
      this.utils.dateFns.differenceInHours(
        new Date(user["daily_last_at"]),
        new Date(user["locale_time"])
      ) >= 24
    ) {
      await this.watchAd("daily_activities");
      await this.claimDailyBonus();
    }
  }

  async startOrClaimMining(user) {
    const miningInfo = await this.getMiningInfo();
    const localTime = miningInfo["localTime"];
    const lastMining = miningInfo["mining_last"];
    const miners = miningInfo["devices"]["miners"];

    if (!miners?.["count"]) {
      this.logger.warn("No miner available!");
      return;
    }

    if (!lastMining) {
      await this.startMining();
      this.logger.success("Started Mining!");
    } else if (
      this.utils.dateFns.isAfter(
        new Date(localTime),
        new Date(lastMining["end_collected_at"])
      )
    ) {
      await this.claimMining();
      this.logger.success("Claimed Mining Rewards!");

      await this.startMining();
      this.logger.success("Started Mining!");
    }
  }
}
