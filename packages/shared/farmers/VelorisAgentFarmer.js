import BaseFarmer from "../lib/BaseFarmer.js";
import CryptoJS from "crypto-js";
import Decimal from "decimal.js";

/** Encryption keys */
const KEY_1 = "J8gD4uKpT2rV9ZbQ";
const KEY_2 = "L1hW7gFqP3kM0VbY";

const PARSED_KEY_1 = CryptoJS.enc.Utf8.parse(KEY_1);
const PARSED_KEY_2 = CryptoJS.enc.Utf8.parse(KEY_2);

const Encrypter = {
  encrypt(data) {
    const content = typeof data !== "string" ? JSON.stringify(data) : data;

    return CryptoJS.AES.encrypt(content, PARSED_KEY_1, {
      iv: PARSED_KEY_2,
    }).toString();
  },

  decrypt(encryptedContent) {
    let content = CryptoJS.AES.decrypt(encryptedContent, PARSED_KEY_1, {
      iv: PARSED_KEY_2,
    }).toString(CryptoJS.enc.Utf8);
    try {
      content = JSON.parse(content);
    } catch {}
    return content;
  },
};

export default class VelorisAgentFarmer extends BaseFarmer {
  static id = "veloris-agent";
  static title = "Veloris Agent";
  static emoji = "🤖";
  static host = "velorisagent.com";
  static domains = ["velorisagent.com"];
  static telegramLink = "https://t.me/velorisagent_bot?start=ref_WJ9NLK3";
  static referrerMode = "random";
  static interval = "*/10 * * * *";
  static rating = 4;

  /** Language for API requests */
  static lang = "zh";

  /** Get Referral Link */
  getReferralLink() {
    const uid = this.authData?.user_info?.uid;

    return uid
      ? `https://t.me/velorisagent_bot?start=ref_${uid}`
      : this.constructor.telegramLink;
  }

  /** Configure API */
  configureApi() {
    const headersInterceptor = this.api.interceptors.request.use((config) => {
      Object.assign(config.headers, this.getExtraHeaders());

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(headersInterceptor);
    };
  }

  /** Get Extra Headers */
  getExtraHeaders() {
    const authData = this.authData;
    const payload = {
      uid: authData?.user_info?.uid || "",
      token: authData?.auth_info || "",
      time: Date.now(),
      device_id: authData?.device_id || "",
      referrer_code: authData?.inviteCode || "",
    };

    return {
      authorization: Encrypter.encrypt(payload),
      time: payload.time,
      lang: authData?.lang || this.constructor.lang,
    };
  }

  /** Get Auth */
  async fetchAuth() {
    return this.login();
  }

  /** Solve Captcha */
  async solveCaptcha() {
    if (!this.canSolveTurnstile()) {
      return "";
    }

    this.logger.info("Solving captcha...");
    const token = await this.solveTurnstile({
      pageUrl: "https://velorisagent.com/login",
      siteKey: "0x4AAAAAADipZn4tGoc-TfDA",
    });
    this.logger.success("Successfully solved captcha!");

    return token;
  }

  /** Login */
  async login() {
    this.logger.info("Logging in...");

    const shouldSolveCaptcha = false;
    const turnstileToken = shouldSolveCaptcha ? await this.solveCaptcha() : "";

    this.authData = await this.api
      .post("https://velorisagent.com/api/user/login/tg", {
        initData: this.getInitData(),
        referrer_code: this.getStartParam(),
        turnstileToken,
      })
      .then((res) => res.data);

    this.logger.success("Successfully logged in!");
    this.logger.success("Referral Link:", this.getReferralLink());

    return this.authData;
  }

  /** Get User Fund */
  getUserFund(signal = this.signal) {
    return this.api
      .get("https://velorisagent.com/api/deal/user/dividend/fund", { signal })
      .then((res) => res.data);
  }

  /** Get Lottery Info */
  getLotteryInfo(signal = this.signal) {
    return this.api
      .get("https://velorisagent.com/api/user/user/user-lottery/info", {
        signal,
      })
      .then((res) => res.data);
  }

  /** Get Check-In Info */
  getCheckInInfo(signal = this.signal) {
    return this.api
      .get("https://velorisagent.com/api/user/user/sign-in/info", { signal })
      .then((res) => res.data);
  }

  /** Claim Profit */
  claimProfit(signal = this.signal) {
    return this.api
      .post(
        "https://velorisagent.com/api/deal/user/dividend/sel",
        {},
        { signal },
      )
      .then((res) => res.data);
  }

  /** Spin Lottery */
  spinLottery(signal = this.signal) {
    return this.api
      .post(
        "https://velorisagent.com/api/user/user/user-lottery/create",
        {},
        { signal },
      )
      .then((res) => res.data);
  }

  /** Complete Check-In */
  completeCheckIn(signal = this.signal) {
    return this.api
      .post(
        "https://velorisagent.com/api/user/user/sign-in/create",
        {},
        { signal },
      )
      .then((res) => res.data);
  }

  /** Exchange Score */
  exchangeScore(money, signal = this.signal) {
    return this.api
      .post(
        "https://velorisagent.com/api/user/user/user-fund/exchange-score",
        { money },
        { signal },
      )
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const info = await this.getUserFund();

    this.logUserInfo(info);

    await this.executeTask("Daily Reward", () =>
      this.checkAndClaimDailyReward(),
    );
    await this.executeTask("Claim Profit", () => this.checkAndClaimProfit());
    await this.executeTask("Lottery", () => this.checkAndSpinLottery());
    await this.executeTask("Swap Fund", () => this.swapFundToTokens());
  }

  /** Log User Info */
  logUserInfo(info) {
    const fund = info.fund;

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", fund.balance);
    this.logger.keyValue("Score", fund.score_balance);
    this.logger.keyValue("Income", info.income);
  }

  /** Check and Claim Daily Reward */
  async checkAndClaimDailyReward() {
    const dailySignIn = await this.getCheckInInfo();

    const today = new Date();
    const todayFormatted = this.utils.dateFns.format(today, "yyyy-MM-dd");
    const hasCheckedInToday = Boolean(
      dailySignIn?.signInList?.[todayFormatted],
    );

    if (hasCheckedInToday) {
      this.logger.info("Already checked-in today.");
      return;
    }

    await this.completeCheckIn();
    this.logger.success("Checked-in successfully!");
  }

  /** Check and Claim Profit */
  async checkAndClaimProfit() {
    const info = await this.getUserFund();
    const income = new Decimal(info.income);

    if (income.lessThan(0.01)) {
      this.logger.info("No profit to claim.");
      return;
    }

    await this.claimProfit();
    this.logger.success(`Claimed ${income.toString()} profit!`);
  }

  /** Check and Spin Lottery */
  async checkAndSpinLottery() {
    const lottery = await this.getLotteryInfo();
    const available = Number(lottery?.info?.lottery_times || 0);

    if (available <= 0) {
      this.logger.info("No lottery spins available.");
      return;
    }

    for (let i = 0; i < available; i++) {
      if (this.signal.aborted) break;
      await this.spinLottery();
      this.logger.success(`Spun lottery (${i + 1}/${available})!`);
      await this.utils.delayForSeconds(3, { signal: this.signal });
    }
  }

  /** Swap Fund to Tokens */
  async swapFundToTokens() {
    const info = await this.getUserFund();
    const score = new Decimal(info.fund.score_balance);
    const balance = new Decimal(info.fund.balance);

    if (score.gte(1000)) {
      this.logger.info(
        "Skipping swap because VA tokens is greater than or equal to 1000.",
      );
      return;
    }

    if (balance.lessThan(0.01)) {
      this.logger.info("Not enough balance to swap.");
      return;
    }

    this.logger.info(`Exchanging ${balance.toString()} to tokens...`);
    await this.exchangeScore(balance.toString());
    this.logger.success(
      `Successfully exchanged ${balance.toString()} to tokens!`,
    );
  }
}
