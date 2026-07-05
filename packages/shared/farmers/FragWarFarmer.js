import BaseFarmer from "../lib/BaseFarmer.js";
import { getAllTimezones } from "countries-and-timezones";
const MINIMUM_WITHDRAWABLE_AMOUNT = 500;

export default class FragWarFarmer extends BaseFarmer {
  static id = "frag-war";
  static title = "Frag War";
  static emoji = "🦀";
  static host = "h5-world-cup.crabet.io";
  static domains = ["h5-world-cup.crabet.io"];
  static telegramLink = "https://t.me/FragWarBot?startapp=10010327";
  static referrerMode = "random";
  static interval = "0 * * * *"; // Every hour
  static rating = 5;

  /** Get Referral Link */
  async getReferralLink() {
    const user = await this.fetchMe();
    return `https://t.me/FragWarBot?startapp=${user?.uid}`;
  }

  /** Get Auth */
  async fetchAuth() {
    return this.login();
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: `Bearer ${data.accessToken}`,
    };
  }

  /** Login */
  async login() {
    this.auth_data = await this.fetchAuthData();

    return this.auth_data;
  }

  /** Fetch Auth Data */
  async fetchAuthData() {
    const timezones = Object.keys(getAllTimezones());
    const selectedTimezone =
      timezones[Math.floor(this.getFixedRandomNumber() * timezones.length)];

    return this.api
      .post("https://h5-world-cup.crabet.io/api/app/auth/telegram-login", {
        initData: this.getInitData(),
        inviteUid: Number(this.getStartParam()),
        deviceId: this.userAgent.slice(0, 64),
        timeZoneId: selectedTimezone,
      })
      .then((res) => res.data.data);
  }

  async fetchMe() {
    return this.api
      .get("https://h5-world-cup.crabet.io/api/app/users/me")
      .then((res) => res.data.data);
  }

  async fetchAssets() {
    return this.api
      .get("https://h5-world-cup.crabet.io/api/app/users/me/assets")
      .then((res) => res.data.data);
  }

  async fetchTotalAssetValue() {
    return this.api
      .get("https://h5-world-cup.crabet.io/api/app/users/me/total-asset-value")
      .then((res) => res.data.data);
  }

  async fetchCurrentRound() {
    return this.api
      .get("https://h5-world-cup.crabet.io/api/app/fragments/current-round")
      .then((res) => res.data.data);
  }

  /** Fetch Card Balance */
  async fetchCardBalance() {
    return this.api
      .get("https://h5-world-cup.crabet.io/api/app/cards/balance")
      .then((res) => res.data.data);
  }

  /** Fetch Regions */
  async fetchRegions() {
    return this.api
      .get("https://h5-world-cup.crabet.io/api/app/fragments/regions")
      .then((res) => res.data.data);
  }

  /** Fetch Refresh Quote */
  async fetchRefreshQuote() {
    return this.api
      .get("https://h5-world-cup.crabet.io/api/app/fragments/refresh-quote")
      .then((res) => res.data.data);
  }

  /** Fetch Tasks */
  async fetchTasks() {
    return this.api
      .get("https://h5-world-cup.crabet.io/api/app/tasks")
      .then((res) => res.data.data);
  }

  /** Claim Fragment */
  async claimFragment(data) {
    return this.api
      .post("https://h5-world-cup.crabet.io/api/app/fragments/claim", data)
      .then((res) => res.data.data);
  }

  /** Check-in */
  async checkIn() {
    return this.api
      .post("https://h5-world-cup.crabet.io/api/app/tasks/check-in", {
        requestId: this.utils.uuid(),
      })
      .then((res) => res.data.data);
  }

  /** Process Farmer */
  async process() {
    const user = await this.fetchMe();

    await this.logUserInfo(user);
    await this.executeTask("Fragment Collection", () =>
      this.claimFragmentCollection(),
    );
    await this.executeTask("Tasks", () => this.completeTasks());
  }

  /** Log User Info */
  async logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();

    this.logger.keyValue("UID", user.uid);
    this.logger.keyValue("Status", user.status);
    this.logger.keyValue("Risk Level", user.riskLevel);
  }

  /** Claim Fragment Collection */
  async claimFragmentCollection() {
    const currentRound = await this.fetchCurrentRound();
    if (currentRound.status === "COOLDOWN") {
      this.logger.info("No fragment collection available at the moment.");
      return;
    } else if (currentRound.status === "CLAIMABLE") {
      const candidate = this.utils.randomItem(currentRound.candidates);

      await this.claimFragment({
        roundId: currentRound.roundId,
        teamCode: candidate.teamCode,
        requestId: this.utils.uuid(),
      });
      this.logger.success("Fragment collection claimed successfully.");
      this.logger.success(`Claimed fragment for team: ${candidate.name}`);
    }
  }

  /** Complete Tasks */
  async completeTasks() {
    const tasks = await this.fetchTasks();

    const dailyCheckInTask = tasks.items.find(
      (task) => task.taskCode === "DAILY_CHECK_IN",
    );
    if (dailyCheckInTask && dailyCheckInTask.status === "TODO") {
      await this.checkIn();
      this.logger.success("Daily check-in completed successfully.");
    } else {
      this.logger.info("No tasks available to complete at the moment.");
    }
  }
}
