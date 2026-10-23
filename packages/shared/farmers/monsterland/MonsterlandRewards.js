import {
  INITIAL_BONUS_REFERRALS,
  MISSION_BUCKETS,
  MISSION_DWELL_SECONDS,
  MISSION_SKIP_REASONS,
  REFERRAL_GOAL_IDS,
} from "./constants.js";
import MonsterlandAds from "./MonsterlandAds.js";

/** Streaks, referral rewards and missions */
export default class MonsterlandRewards extends MonsterlandAds {
  /* --------------------------------------------------------------------- */
  /* Streak                                                                */
  /* --------------------------------------------------------------------- */

  /** Claim today's streak reward once */
  async claimStreak() {
    const streak = this.getProfile()["daily_streak_state"];

    if (!streak) {
      this.logger.info("No streak state to read.");
      return;
    }

    if (streak["streak_reward_claimed_today"]) {
      this.logger.info("Streak already claimed today.");
      return;
    }

    if (streak["streak_is_lost"]) {
      this.logger.warn("The streak is lost, claim it once in the app.");
      return;
    }

    const result = await this.claimDailyStreak();

    if (!result.ok) {
      this.logger.warn("Failed to claim streak:", result.data["error"]);
      return;
    }

    this.applyResult(result.data);
    this.logger.success(`Claimed streak day ${(streak["days"] || 0) + 1}.`);
  }

  /* --------------------------------------------------------------------- */
  /* Referrals                                                             */
  /* --------------------------------------------------------------------- */

  /** Claim referral lumis, the newcomer bonus and every goal reached */
  async claimReferrals() {
    const referral = await this.fetchReferral();
    const total = Number(referral["total_referrals"]) || 0;

    if (Number(referral["claimable_lumis"]) > 0) {
      await this.claimReferralReward(
        "lumis",
        undefined,
        `${referral["claimable_lumis"]} referral lumis`,
      );
    }

    const bonusDeadline = referral["initial_bonus_deadline"]
      ? new Date(referral["initial_bonus_deadline"]).getTime()
      : Infinity;

    if (
      referral["initial_bonus_active"] &&
      !referral["initial_bonus_claimed"] &&
      total >= INITIAL_BONUS_REFERRALS &&
      Date.now() < bonusDeadline
    ) {
      await this.claimReferralReward(
        "initial_bonus",
        undefined,
        "the referral egg",
      );
    }

    const claimed = new Set((referral["goals_claimed"] || []).map(Number));

    for (const id of REFERRAL_GOAL_IDS) {
      if (id <= total && !claimed.has(id)) {
        await this.claimReferralReward("goal", id, `goal ${id}`);
      }
    }
  }

  /** Claim one referral reward and log it */
  async claimReferralReward(type, id, label) {
    const result = await this.claimReferral(type, id);

    if (!result.ok || result.data["success"] === false) {
      this.logger.warn(`Failed to claim ${label}:`, result.data["error"]);
      return;
    }

    this.applyResult(result.data);
    this.logger.success(`Claimed ${label}.`);
  }

  /* --------------------------------------------------------------------- */
  /* Missions                                                              */
  /* --------------------------------------------------------------------- */

  /** Claim every available mission across the board's buckets */
  async completeMissions() {
    for (const bucket of MISSION_BUCKETS) {
      const missions = await this.fetchAllMissions(bucket);

      for (const mission of missions) {
        if (this.signal.aborted) return;

        await this.completeMission(mission);
      }
    }
  }

  /** Every page of a bucket */
  async fetchAllMissions(bucket) {
    const missions = [];
    let cursor = null;

    do {
      const page = await this.fetchMissions(bucket, cursor);

      missions.push(...(page["missions"] || []));
      cursor = page["hasMore"] ? page["nextCursor"] : null;
    } while (cursor && !this.signal.aborted);

    return missions;
  }

  /** Open a mission's link, wait, and claim it */
  async completeMission(mission) {
    const url = mission["url"];

    if (url && !this.validateTelegramTask(url)) {
      return;
    }

    await this.openTaskLink(url, MISSION_DWELL_SECONDS);

    const result = await this.claimMission(mission["id"]);

    if (!result.ok) {
      const reason = result.data["reason"];

      if (reason === "RATE_LIMIT") {
        this.logger.info("Mission claims are rate limited, stopping.");
        throw new Error("Mission claims are rate limited");
      }

      if (!MISSION_SKIP_REASONS.includes(reason)) {
        this.logger.warn(
          `Failed to claim "${mission["title"]}":`,
          result.data["error"] || reason,
        );
      }
      return;
    }

    this.applyResult(result.data);
    this.logger.success(
      `Claimed "${mission["title"]}" for ${mission["rewardLumis"] ?? "?"} lumis.`,
    );
  }
}
