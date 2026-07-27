import { fromCrossJSON, toJSON } from "seroval";
import { defaultSerovalPlugins } from "@tanstack/router-core";

import BaseFarmer from "../lib/BaseFarmer.js";

export default class PikaFarmer extends BaseFarmer {
  static id = "pika";
  static title = "Pika";
  static emoji = "⚡";
  static host = "pikaairdrop.lovable.app";
  static domains = ["pikaairdrop.lovable.app"];
  static telegramLink =
    "https://t.me/Pikaairdropbot/app?startapp=ref_1147265290";
  static referrerMode = "random";
  static apiDelay = 500;
  static singleton = true;
  static rating = 5;
  static netRequest = {
    requestHeaders: [
      {
        header: "x-tsr-serverfn",
        operation: "set",
        value: "true",
      },
    ],
  };

  /** Retrieve server functions */
  async retrieveServerFunctions() {
    const baseUrl = "https://pikaairdrop.lovable.app";
    const htmlContent = await this.api.get(baseUrl).then((res) => res.data);
    const scriptSrc = htmlContent.match(/src="(\/assets\/index-[^"]+)"/);
    const scriptUrl = new URL(scriptSrc[1], baseUrl).href;

    const scriptContent = await this.api.get(scriptUrl).then((res) => res.data);

    const list = scriptContent.match(/({[^}]+setTonAddress:[^}]+})/);
    const listMethods = list[0].matchAll(/([a-zA-Z]+):\(\)=>([^},]+)/g);

    const listCallbacks = scriptContent.matchAll(
      /\s*([A-Za-z\d]+)=[^=]+method:\s*['"`]([^'"`]+)['"`][^=]+\.handler[^=]+([a-z\d]{64})/g,
    );

    const methods = Array.from(listMethods);
    const callbacks = Array.from(listCallbacks);

    const result = Object.fromEntries(
      methods.map((item) => {
        const callback = callbacks.find((c) => c[1] === item[2]);
        return [
          item[1],
          {
            id: callback?.[3],
            method: callback?.[2],
            callbackName: item[2],
          },
        ];
      }),
    );

    this.constructor.__serverFunctions = result;

    this.debugger.log("Methods:", methods);
    this.debugger.log("Callbacks:", callbacks);
    this.debugger.log("Server functions:", result);
  }

  /** Get server functions */
  async getServerFunctions() {
    if (!this.constructor.__serverFunctions) {
      this.constructor.__serverFunctionsPromise ??=
        this.retrieveServerFunctions();
      await this.constructor.__serverFunctionsPromise;
    }

    return this.constructor.__serverFunctions;
  }

  /** Execute a server function */
  async executeServerFunction(name, payload) {
    const serverFunctions = await this.getServerFunctions();
    const serverFunction = serverFunctions[name];
    if (!serverFunction) {
      throw new Error(`Server function ${name} not found`);
    }

    this.debugger.log(`Executing server function: ${name}`, serverFunction);
    this.debugger.log("Payload:", payload);

    let data;

    if (payload) {
      data = await toJSON({ data: payload });
      this.debugger.log(`Serialized payload: ${data}`);
    }

    return this.api
      .request({
        url: `https://pikaairdrop.lovable.app/_serverFn/${serverFunction.id}`,
        method: serverFunction.method,
        data: data,
        responseType: "text",
        headers: {
          "x-tsr-serverfn": true,
        },
      })
      .then((res) => {
        // Enable this to log the response if needed
        // this.debugger.log(`Response: ${res.data}`);
        return this.deserializeServerResponse(res);
      })
      .catch((error) => {
        this.debugger.error("Failed to execute server function:", error);
        throw error;
      });
  }

  /**
   * Deserialize a TanStack Start server function response.
   */
  deserializeServerResponse(res) {
    const isSerialized = Boolean(res.headers?.["x-tss-serialized"]);
    const payload = JSON.parse(res.data);

    /* Unserialized responses (redirects, raw JSON) are returned as-is */
    if (!isSerialized) {
      return payload;
    }

    const data = fromCrossJSON(payload, { plugins: defaultSerovalPlugins });
    this.debugger.log("Deserialized result:", data);

    /* Start throws serialized Errors instead of returning them */
    if (data instanceof Error) {
      throw data;
    }

    /*
     * Failures still come back as HTTP 200 — the `{ result, error, context }`
     * envelope carries a serialized Error and leaves `result` undefined.
     */
    if (data?.error) {
      throw data.error instanceof Error
        ? data.error
        : new Error(data.error.message || String(data.error));
    }

    return data.result;
  }

  /** Readable message for a failed server function call */
  getErrorMessage(error) {
    return error?.message || error?.response?.data?.message || "Unknown error";
  }

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/Pikaairdropbot/app?startapp=ref_${this.getUserId()}`;
  }

  /** Get or create device ID (stands in for the browser device fingerprint) */
  getOrCreateDeviceId() {
    if (!this.deviceId) {
      const userId = this.getUserId()?.toString() ?? "";
      if (!userId) {
        throw new Error("User ID is required");
      }

      /* Generate a stable device ID */
      this.deviceId = this.utils.md5(userId).substring(0, 8);
    }

    return this.deviceId;
  }

  /** Make request ID */
  makeRequestId() {
    return this.utils.uuid();
  }

  /** Determine if the request should be retried */
  shouldRetryRequest(error) {
    const retryAfter = error.response?.data?.retry_after;
    if (retryAfter) {
      return true;
    }
    return false;
  }

  /* --------------------------------------------------------------------- */
  /* Server function wrappers                                              */
  /*                                                                       */
  /* Every server function that requires auth receives the Telegram        */
  /* `initData` in its payload; `executeServerFunction` wraps the payload   */
  /* as `{ data: payload }` exactly like the TanStack Start client does.    */
  /* --------------------------------------------------------------------- */

  /** Build a payload that always carries the auth `initData` */
  withInitData(extra = {}) {
    return { initData: this.getInitData(), ...extra };
  }

  /** getMe — fetch the current account state */
  getMe() {
    return this.executeServerFunction(
      "getMe",
      this.withInitData({ deviceFingerprint: this.getOrCreateDeviceId() }),
    );
  }

  /** claim — claim all pending mined PIKA */
  claim() {
    return this.executeServerFunction("claim", this.withInitData());
  }

  /** activateBoost — activate the "max speed" mining boost */
  activateBoost() {
    return this.executeServerFunction("activateBoost", this.withInitData());
  }

  /** openSuperBall — open the daily super ball; returns { ok, prize, tier } */
  openSuperBall() {
    return this.executeServerFunction("openSuperBall", this.withInitData());
  }

  /** getCheckin — fetch and (server-side) claim the daily check-in */
  getCheckin() {
    return this.executeServerFunction("getCheckin", this.withInitData());
  }

  /** listTasks — list the available tasks */
  listTasks() {
    return this.executeServerFunction("listTasks", this.withInitData());
  }

  /** completeTask — complete a task by id */
  completeTask(taskId) {
    return this.executeServerFunction(
      "completeTask",
      this.withInitData({ taskId }),
    );
  }

  /** getReferrals — fetch the referral / friends summary */
  getReferrals() {
    return this.executeServerFunction("getReferrals", this.withInitData());
  }

  /** getLevelJourney — fetch level progression details */
  getLevelJourney() {
    return this.executeServerFunction("getLevelJourney", this.withInitData());
  }

  /** listWithdrawals — fetch the withdrawal history */
  listWithdrawals() {
    return this.executeServerFunction("listWithdrawals", this.withInitData());
  }

  /**
   * requestWithdraw — request a PIKA withdrawal to the linked TON address.
   *
   * The client spreads arbitrary params into the payload (`{ initData, ...t }`).
   * The amount field name is not verified from the bundle; adjust `params` if
   * the API rejects the request.
   */
  requestWithdraw(params = {}) {
    return this.executeServerFunction(
      "requestWithdraw",
      this.withInitData(params),
    );
  }

  /**
   * setTonAddress — link a TON wallet address to the account.
   *
   * Pika's `setTonAddress` only needs the raw TON address string (the frontend
   * TON Connect proof never reaches the server function), so no wallet key or
   * signature is required here.
   */
  setTonAddress(tonAddress) {
    return this.executeServerFunction(
      "setTonAddress",
      this.withInitData({
        ton_address: tonAddress,
        deviceFingerprint: this.getOrCreateDeviceId(),
      }),
    );
  }

  /** listMiners — list purchasable miners (GET, no payload) */
  listMiners() {
    return this.executeServerFunction("listMiners");
  }

  /** getLeaderboard — fetch the leaderboard (GET, no payload) */
  getLeaderboard() {
    return this.executeServerFunction("getLeaderboard");
  }

  /* --------------------------------------------------------------------- */
  /* Auth                                                                  */
  /* --------------------------------------------------------------------- */

  /** Fetch Auth */
  async fetchAuth() {
    this.user_data = await this.getMe();
    this.debugger.log("User data:", this.user_data);
    return this.user_data;
  }

  /** Login */
  async login() {
    this.user_data = await this.getMe();
    return this.user_data;
  }

  /** Get User Details */
  getUserDetails() {
    return this.user_data?.user;
  }

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  async process() {
    const me = await this.login();

    this.logUserInfo(me);
    await this.executeTask("Check-in", () => this.dailyCheckin());

    /* Boost first — its bonus lands in `pending_balance`, so the claim takes it */
    await this.executeTask("Boost", () => this.applyBoost());
    await this.executeTask("Mining", () => this.claimMining());
    await this.executeTask("Super Ball", () => this.playSuperBall());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Friends", () => this.logReferrals());
  }

  /* --------------------------------------------------------------------- */
  /* Tasks / actions                                                       */
  /* --------------------------------------------------------------------- */

  /** Log the current account state */
  logUserInfo(me) {
    const user = me?.user || {};
    const miner = me?.miner || {};
    const holding = Number(me?.holding_balance ?? 0);
    const pool = Number(user?.pool_balance ?? 0);
    const claimable =
      Number(me?.pending ?? 0) + Number(me?.pending_balance ?? 0);

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Generated Device", this.getOrCreateDeviceId(), {
      valueStyle: this.logger.c.blueBright,
    });

    this.logger.keyValue("Current Device", user.device_fingerprint, {
      valueStyle: this.logger.c.yellowBright,
    });
    this.logger.keyValue("Holding Balance", holding.toFixed(4));
    this.logger.keyValue("Pool Balance", pool.toFixed(4));
    this.logger.keyValue("Total Balance", (holding + pool).toFixed(4), {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue("Miner Level", miner.level ?? 1);
    this.logger.keyValue("Hash Speed", miner.hash_speed ?? 0);
    this.logger.keyValue("PIKA / Hour", miner.pika_per_hour ?? 0);
    this.logger.keyValue("Claimable", claimable.toFixed(4), {
      valueStyle: this.logger.c.yellowBright,
    });
    this.logger.keyValue(
      "Wallet Connected",
      me?.wallet_connected ? "Yes" : "No",
    );

    if (user.ton_address) {
      this.logger.keyValue("TON Address", user.ton_address);
    }

    this.logger.keyValue("Banned", user.banned ? "Yes 🚫" : "No ✅");
    if (user.ban_reason) {
      this.logger.keyValue("Ban Reason", user.ban_reason, {
        valueStyle: this.logger.c.redBright,
      });
    }
  }

  /** Daily check-in (getCheckin claims the reward server-side when eligible) */
  async dailyCheckin() {
    let streak = this.user_data?.user?.checkin_streak;

    try {
      const checkin = await this.getCheckin();
      this.debugger.log("Check-in result:", checkin);

      /* The reward lands in `pending_balance`, so the mining claim collects it */
      this.logger.success(`Checked in! (+${checkin?.reward ?? 0} PIKA)`);
      streak = checkin?.streak ?? streak;

      if (checkin?.next_available_at) {
        this.logger.keyValue(
          "Next Check-in",
          new Date(checkin.next_available_at).toLocaleString(),
        );
      }
    } catch (error) {
      /* A second check-in is rejected with "Already checked in today" */
      if (!/already checked in/i.test(this.getErrorMessage(error))) {
        throw error;
      }

      this.logger.info("Already checked in today.");
    }

    if (streak != null) {
      this.logger.keyValue("Check-in Streak", `${streak}/10`);
    }
  }

  /** Claim mined PIKA when there is anything to claim */
  async claimMining() {
    const me = this.user_data;

    if (!me?.wallet_connected) {
      this.logger.warn(
        "Wallet not connected — mining stays inactive until a TON address is linked.",
      );
      return;
    }

    const perHour = Number(me?.miner?.pika_per_hour ?? 0);
    if (perHour <= 0) {
      this.logger.warn("Miner is not active.");
      return;
    }

    const claimable =
      Number(me?.pending ?? 0) + Number(me?.pending_balance ?? 0);
    if (claimable <= 0) {
      this.logger.info("Nothing to claim yet.");
      return;
    }

    this.logger.info(`Claiming ${claimable.toFixed(4)} PIKA...`);
    const result = await this.claim();
    this.debugger.log("Claim result:", result);

    /* Refresh the cached account state after claiming */
    this.user_data = await this.getMe();
    this.logger.success("Claimed!");
  }

  /**
   * Activate the mining boost — the app's "tap the coin" action, which runs the
   * miner at max speed for `duration` seconds and credits a small bonus.
   */
  async applyBoost() {
    try {
      const result = await this.activateBoost();
      this.debugger.log("Boost result:", result);

      const bonus = Number(result?.bonus ?? 0);
      this.logger.success(
        `Boost activated for ${result?.duration ?? 0}s (+${bonus.toFixed(6)} PIKA)`,
      );
    } catch (error) {
      this.logger.warn("Boost unavailable:", this.getErrorMessage(error));
    }
  }

  /** Open a super ball when one is available */
  async playSuperBall() {
    const balls = Number(this.user_data?.super_balls ?? 0);
    if (balls <= 0) {
      this.logger.info("No super balls available.");
      return;
    }

    try {
      const result = await this.openSuperBall();
      this.debugger.log("Super ball result:", result);

      if (result?.ok) {
        this.logger.success(
          `Super Ball prize: ${result.prize} (tier ${result.tier})`,
        );
      } else {
        this.logger.info(`Super Ball unavailable: ${result?.reason ?? "n/a"}`);
      }
    } catch (error) {
      this.logger.warn("Super Ball unavailable:", this.getErrorMessage(error));
    }
  }

  /** Complete any outstanding tasks */
  async completeTasks() {
    const data = await this.listTasks();
    this.debugger.log("Tasks:", data);

    const tasks = Array.isArray(data) ? data : data?.tasks || [];
    const now = Date.now();

    /*
     * Tasks repeat on a `cooldown_seconds` cycle: `done` marks the current
     * cycle as claimed, and `available_at` is when the next one opens up.
     * Completing either kind is rejected with "Task on cooldown".
     */
    const pending = tasks.filter(
      (task) =>
        !task.done &&
        !(task.available_at && new Date(task.available_at).getTime() > now),
    );

    if (!pending.length) {
      this.logger.info("No tasks to complete.");
      return;
    }

    for (const task of pending) {
      if (this.signal.aborted) break;

      const taskId = task.id;
      const title = task.title ?? taskId;

      try {
        await this.tryToJoinTelegramLink(task.url);
        await this.completeTask(taskId);
        this.logger.success(`Completed task: ${title} (+${task.reward} PIKA)`);
      } catch (error) {
        this.logger.warn(
          `Task "${title}" failed:`,
          this.getErrorMessage(error),
        );
      }

      await this.utils.delayForSeconds(15, { signal: this.signal });
    }
  }

  /** Log the referral summary */
  async logReferrals() {
    const data = await this.getReferrals();
    this.debugger.log("Referrals:", data);

    const referrals = data?.referrals || [];
    this.logger.keyValue("Referrals", referrals.length);
  }

  /* --------------------------------------------------------------------- */
  /* Tools (manual actions)                                                */
  /* --------------------------------------------------------------------- */

  createTools() {
    return [
      {
        name: "Wallet",
        list: [
          {
            id: "set-ton-address",
            icon: "wallet",
            title: "Set TON Address",
            action: this.connectTonAddress.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Withdrawal",
        list: [
          {
            id: "withdraw",
            icon: "withdraw",
            title: "Withdraw",
            action: this.withdraw.bind(this),
            dispatch: false,
          },
        ],
      },
    ];
  }

  /** Link a TON wallet address */
  async connectTonAddress() {
    const input = await this.promptInput("Enter your TON wallet address:");
    const address = (input || "").trim();

    if (!address) {
      this.logger.warn("No address provided.");
      return;
    }

    const result = await this.setTonAddress(address);
    this.debugger.log("Set TON address result:", result);

    this.user_data = await this.getMe();
    this.logger.success("TON address linked!");
  }

  /** Request a withdrawal */
  async withdraw() {
    const me = this.user_data;
    const user = me?.user;

    if (!user?.ton_address) {
      this.logger.warn(
        "Wallet not connected - withdraw stays inactive until a TON address is linked.",
      );
      return;
    }

    /* Withdrawals are paid out of the pool balance */
    const terms = me?.withdraw_terms || {};
    const pool = Number(user.pool_balance ?? 0);
    const min = Number(terms.min ?? 0);

    this.logger.keyValue("Pool Balance", pool.toFixed(4));
    if (min) {
      this.logger.keyValue("Minimum", min);
    }

    const input = await this.promptInput("Enter amount of PIKA to withdraw:");
    const amount = parseFloat((input || "").trim());

    if (!amount) {
      this.logger.warn("No amount provided.");
      return;
    }

    if (amount > pool) {
      this.logger.warn(`Pool balance is only ${pool.toFixed(4)} PIKA.`);
      return;
    }

    if (min && amount < min) {
      this.logger.warn(`Minimum withdrawal is ${min} PIKA.`);
      return;
    }

    /* Mirrors the app's preview: ceil(amount * fee_rate), clamped to [1, fee_max] */
    const feeMax = Number(terms.fee_max ?? terms.fee ?? Infinity);
    const fee = Math.max(
      1,
      Math.min(feeMax, Math.ceil(amount * Number(terms.fee_rate ?? 0.1))),
    );
    this.logger.info(
      `Fee ${fee} PIKA - you receive ${(amount - fee).toFixed(4)} PIKA`,
    );

    const result = await this.requestWithdraw({
      amount,
      ton_address: user.ton_address,
    });

    this.debugger.log("Withdraw result:", result);

    this.logger.success("Withdrawal requested!");
    this.user_data = await this.getMe();
  }
}
