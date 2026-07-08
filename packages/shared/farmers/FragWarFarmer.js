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

  /** Fetch Exchange Config */
  async fetchExchangeConfig() {
    return this.api
      .get("https://h5-world-cup.crabet.io/api/app/exchange/config")
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

  /** Refresh Fragments */
  async refreshFragments(roundId) {
    return this.api
      .post("https://h5-world-cup.crabet.io/api/app/fragments/refresh", {
        roundId,
        requestId: this.utils.uuid(),
      })
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
    const allRegions = await this.fetchRegions();
    const config = await this.fetchExchangeConfig();

    while (true) {
      const assets = await this.fetchAssets();
      const regions = assets.fragment.regions
        .map((region) => {
          /** Origin */
          const origin = allRegions.regions.find(
            (item) => item.regionCode === region.regionCode,
          );

          /** Region Asset */
          const asset = config.assetOptions.find(
            (item) => item.assetCode === origin.targetAssetCode,
          );

          /** Region Progress */
          const regionProgress = region.teams.filter(
            (item) => item.availableBalance > 0,
          ).length;

          /** Region Required */
          const regionRequired = region.teams.length;

          /** Region Needed */
          const regionNeeded = region.teams.length - regionProgress;

          /** Teams */
          const teams = region.teams
            .map((team) => {
              const required = asset.minFragmentQuantity;
              const needed = asset.minFragmentQuantity - team.availableBalance;
              return {
                ...team,
                origin,
                needed,
                asset,
                required,
                regionProgress,
                regionRequired,
                regionNeeded,
              };
            })
            .sort((a, b) => b.availableBalance - a.availableBalance);

          return {
            ...region,
            teams: teams,
            origin: origin,
            required: regionRequired,
            progress: regionProgress,
            needed: regionNeeded,
          };
        })
        .sort((a, b) => a.needed - b.needed);

      /** Sort Teams by Available Balance */
      const teams = regions
        .flatMap((region) => region.teams)
        .sort((a, b) => b.availableBalance - a.availableBalance);

      /** Filter Teams with Available Balance */
      const teamsWithBalance = teams.filter(
        (team) => team.availableBalance > 0,
      );

      /** Log Available Regions */
      this.logger.info("Available Regions:");
      regions.forEach((region) => {
        this.logger.keyValue(
          `(${region.regionCode}) ${region.regionName}`,
          `(${region.progress}/${region.required}) - ${region.needed}`,
        );
      });
      this.logger.newline();

      /** Log Available Teams */
      this.logger.info("Available Fragment Teams:");
      teams.forEach((team) => {
        this.logger.keyValue(
          `(${team.teamCode}) ${team.teamName}`,
          `(${team.availableBalance}/${team.required}) - ${team.needed}`,
        );
      });

      const teamsWithNeed = teamsWithBalance
        .filter((item) => item.needed > 0)
        .slice(0, 2);

      const regionWithNeed = regions.filter((item) => item.needed > 0)[0];
      const regionWithNeedTeams =
        regionWithNeed?.teams?.filter((item) => item.availableBalance <= 0) ||
        [];

      while (true) {
        /** Fetch Current Round */
        const currentRound = await this.fetchCurrentRound();

        if (currentRound.status === "COOLDOWN") {
          this.logger.info("No fragment collection available at the moment.");
          return;
        } else if (currentRound.status === "CLAIMABLE") {
          const roundId = currentRound.roundId;
          const candidates = currentRound.candidates
            .map((candidate) => {
              const team = teams.find(
                (team) => team.teamCode === candidate.teamCode,
              );
              const availableBalance = team?.availableBalance || 0;
              const regionImportance = availableBalance < 1 ? 1 : 0;
              const regionNeeded = team.regionNeeded;

              return {
                ...candidate,
                team,
                availableBalance,
                regionImportance,
                regionNeeded,
              };
            })
            .sort((a, b) => a.team.needed - b.team.needed);

          /** Log Candidates */
          this.logger.info("Fragment Collection Candidates:");
          candidates.forEach((candidate) => {
            this.logger.keyValue(
              `(${candidate.teamCode}) ${candidate.name}`,
              `(${candidate.team.availableBalance}/${candidate.team.required}) - ${candidate.team.needed}`,
            );
          });

          /** Select Candidate with Available Balance */
          let selectedCandidate = null;

          if (teamsWithBalance.length > 0) {
            /** Find a candidate with existing balance */
            selectedCandidate = [...regionWithNeedTeams, ...teamsWithNeed].find(
              (item) =>
                candidates.some(
                  (candidate) => candidate.teamCode === item.teamCode,
                ),
            );

            if (!selectedCandidate) {
              /** Get refresh quote */
              const refreshQuote = await this.fetchRefreshQuote();
              const { yellowCardBalance, nextRefreshYellowCardCost } =
                refreshQuote;

              /** Check if we can refresh */
              const canRefresh = nextRefreshYellowCardCost <= yellowCardBalance;

              if (canRefresh) {
                this.logger.info(
                  "Refreshing fragments to get a better candidate...",
                );
                const refresh = await this.refreshFragments(roundId);
                await this.utils.delayForSeconds(2);
                continue; // Restart the loop to process the new round
              }
            }
          }

          /** Select the candidate */
          const candidate =
            selectedCandidate || this.utils.randomItem(candidates);

          /** Claim fragment */
          await this.claimFragment({
            roundId: roundId,
            teamCode: candidate.teamCode,
            requestId: this.utils.uuid(),
          });
          this.logger.success("Fragment collection claimed successfully.");
          this.logger.success(`Claimed fragment for team: ${candidate.name}`);

          await this.utils.delayForSeconds(2);
        }
      }
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
