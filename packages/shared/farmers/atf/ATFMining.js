import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { logMiningRateBreakdown } from "../../lib/farmer/format.js";
import {
  MAX_MINING_CYCLE_SECONDS,
  TAP_V2_BATCH_MAX,
  TAP_V2_BATCH_SECONDS,
  TAP_V2_TAPS_PER_SECOND,
} from "./constants.js";
import Decimal from "decimal.js";

/** Taps, mining sessions, boosts and the maths behind them */
export default class ATFMining extends FarmerModule {
  /** Random base36 id with the app's prefix, as the tap script makes them */
  createTapV2Id(prefix, words) {
    const values = crypto.getRandomValues(new Uint32Array(words));
    return prefix + Array.from(values, (x) => x.toString(36)).join("");
  }

  /** Tap client instance, kept per run like the app's sessionStorage value */
  getTapV2ClientInstance() {
    if (!this.tapV2ClientInstance) {
      this.tapV2ClientInstance = this.createTapV2Id("c_", 4);
    }

    return this.tapV2ClientInstance;
  }

  /** Spend the tap energy in batches before claiming, as the app flushes taps before every claim */
  async tapV2() {
    const state = await this.ctx.tasks.makeProfileTaskClaim(() =>
      this.ctx.api.getTapV2State(),
    );

    if (state?.["status"] !== "success") {
      this.logger.warn("Tap state unavailable");
      return;
    }

    if (state["tap_locked"]) {
      this.logger.warn(`Tap locked for ${state["retry_after"]}s`);
      return;
    }

    /** The app only taps in tap mode, boost mode hands the coin to the boost */
    if (state["engagement_mode"] !== "tap") {
      this.logger.warn("Tap is in boost mode");
      return;
    }

    if (Number(state["boost_finishing_until"]) > Date.now() / 1000) {
      this.logger.warn("Tap blocked while a boost finishes");
      return;
    }

    const sessionNonce = String(state["session_nonce"] || "");
    let seq = (parseInt(state["last_seq"], 10) || 0) + 1;
    let energy = Number(state["energy"]) || 0;
    let energyCost = Math.max(0.25, Number(state["energy_cost"]) || 1.5);
    let total = 0;

    while (energy >= energyCost) {
      const taps = Math.min(
        TAP_V2_BATCH_MAX,
        TAP_V2_BATCH_SECONDS * TAP_V2_TAPS_PER_SECOND,
        Math.floor(energy / energyCost),
      );

      await this.utils.delayForSeconds(
        Math.ceil(taps / TAP_V2_TAPS_PER_SECOND),
        { signal: this.signal },
      );

      const result = await this.ctx.tasks.makeProfileTaskClaim(() =>
        this.ctx.api.syncTapV2({ sessionNonce, seq, taps }),
      );

      if (result?.["status"] !== "success") {
        if (result?.["reason"] === "tap_autoclick_locked") {
          this.logger.warn(`Tap autoclick lock for ${result["retry_after"]}s`);
        } else {
          this.logger.warn(`Tap sync failed: ${result?.["reason"]}`);
        }
        break;
      }

      seq = parseInt(result["next_seq"], 10) || seq + 1;
      energy = Number(result["energy"]) || 0;
      energyCost = Math.max(0.25, Number(result["energy_cost"]) || energyCost);
      total += taps;

      if (result["pending_reward"] !== undefined) {
        this.ctx.state.data.user["pending_reward"] = result["pending_reward"];
      }

      this.logger.info(
        `Tapped ${taps} (pending: ${this.ctx.state.data.user["pending_reward"]})`,
      );
    }

    if (total > 0) {
      this.logger.success(`Tapped ${total} times`);
    }
  }

  getAnswerForChallenge(question) {
    const match = question.toLowerCase().match(/(\d+)\s*([+\-*/÷x])\s*(\d+)/);
    if (!match) throw new Error("Invalid math challenge format");

    const x = Number(match[1]);
    const y = Number(match[3]);
    const op = match[2];

    if (op === "+") return x + y;
    if (op === "-") return x - y;
    if (op === "*" || op === "x") return x * y;
    if (op === "/" || op === "÷") {
      if (y === 0) throw new Error("Division by zero");
      return Math.floor(x / y);
    }

    throw new Error("Unknown operator");
  }

  getMinerRate(level) {
    const BASE_RATE = new Decimal(10);
    const RATE_GROWTH = new Decimal("1.0181532961");

    return BASE_RATE.times(RATE_GROWTH.pow(level - 1)).floor();
  }

  /** Hash power exactly as the ATF app shows it: TH/s = rate / 50 */
  getMinerHashPower(level) {
    return this.getMinerRate(level).div(50);
  }

  getMinerCost(level) {
    if (level <= 1) return new Decimal(0);

    const REQ_GROWTH = new Decimal("1.0257185327");

    return new Decimal(100).times(REQ_GROWTH.pow(level - 2)).floor();
  }

  findLevelForAtf(atfAmount) {
    const amount = new Decimal(atfAmount);
    let level = 1;

    while (level < 680 && amount.gte(this.getMinerCost(level + 1))) {
      level++;
    }

    return level;
  }

  getDifficultyDivisor(difficulty, level, exemptMinLevel, exemptMaxLevel) {
    if (
      exemptMinLevel > 0 &&
      exemptMaxLevel > 0 &&
      level >= exemptMinLevel &&
      level <= exemptMaxLevel
    ) {
      return new Decimal(1);
    }
    const d = new Decimal(difficulty).clamp(1, 10000);
    if (d.lte(100)) return d.minus(1).div(100).plus(1);
    return d.minus(100).div(15).plus(1.99);
  }

  getMiningRewardParts(level, difficulty, exemptMinLevel, exemptMaxLevel) {
    const rate = this.getMinerRate(level);
    const divisor = this.getDifficultyDivisor(
      difficulty,
      level,
      exemptMinLevel,
      exemptMaxLevel,
    );

    return {
      rate,
      divisor,
      passivePerSecond: rate.div(divisor).div(86400),
      boostTapReward: rate.div(100000).div(divisor),
    };
  }

  /** When the mining cycle freezes, falling back to the app's 72h window from the cycle start */
  getMiningFreezeAt(user) {
    const freezesAt = Number(user["mining_freezes_at"]) || 0;
    if (freezesAt > 0) return freezesAt;

    const cycleStart =
      Number(user["mining_cycle_started_at"]) ||
      Number(user["last_mining_start"]) ||
      0;

    return cycleStart > 0 ? cycleStart + MAX_MINING_CYCLE_SECONDS : 0;
  }

  /** Keep the mining fields a start, claim or boost hands back */
  applyMiningState(result) {
    const user = this.ctx.state.data.user;

    for (const key of [
      "mining_cycle_started_at",
      "mining_freezes_at",
      "boost_ready_at",
      "boost_active_until",
      "boost_power_snapshot",
      "mining_difficulty_snapshot",
    ]) {
      if (result?.[key] !== undefined) {
        user[key] = result[key];
      }
    }

    /** A fresh segment is no longer frozen */
    user["mining_frozen"] = 0;
  }

  calculateSessionBalance({
    user,
    difficulty,
    boostCycleSeconds,
    exemptMinLevel,
    exemptMaxLevel,
  }) {
    const nowSec = Date.now() / 1000;
    const lastMiningStart = Number(user["last_mining_start"]);
    if (lastMiningStart === 0) return new Decimal(0);

    const level = Number(user["miner_level"]);
    const diffSnapshot =
      Number(user["mining_difficulty_snapshot"]) || difficulty;
    const { rate, divisor, passivePerSecond, boostTapReward } =
      this.getMiningRewardParts(
        level,
        diffSnapshot,
        exemptMinLevel,
        exemptMaxLevel,
      );
    const pendingReward = new Decimal(user["pending_reward"] || 0);

    /** Mining stops accruing at the freeze point, as the app counts it */
    const freezeAt = this.getMiningFreezeAt(user);
    const cappedNow = freezeAt > 0 ? Math.min(nowSec, freezeAt) : nowSec;
    const elapsed = Math.max(cappedNow - lastMiningStart, 0);
    const passiveReward = passivePerSecond.times(elapsed);

    const boostActiveUntil = Number(user["boost_active_until"]) || 0;
    const boostPower = Number(user["boost_power_snapshot"]) || 0;
    let boostReward = new Decimal(0);

    if (boostActiveUntil > lastMiningStart && boostPower > 0) {
      const boostStart = Math.max(
        lastMiningStart,
        boostActiveUntil - boostCycleSeconds,
      );
      const cappedNow = lastMiningStart + elapsed;
      const boostSeconds = Math.max(
        0,
        Math.min(cappedNow, boostActiveUntil) -
          Math.max(lastMiningStart, boostStart),
      );
      boostReward = boostTapReward.times(boostSeconds).times(boostPower);
    }

    return pendingReward
      .plus(passiveReward)
      .plus(boostReward)
      .toDecimalPlaces(4);
  }

  getDailyMiningRateForLevel(level, diffData, diffSnapshot) {
    const { rate, divisor } = this.getMiningRewardParts(
      level,
      diffSnapshot || diffData.difficulty,
      diffData.exemptMinLevel,
      diffData.exemptMaxLevel,
    );
    return rate.div(divisor);
  }

  getDailyMiningRate(user, diffData) {
    return this.getDailyMiningRateForLevel(
      Number(user["miner_level"]),
      diffData,
      Number(user["mining_difficulty_snapshot"]) || diffData.difficulty,
    );
  }

  async estimateDailyMining() {
    const input = await this.core.prompt("How much ATF?");
    const trimmed = (input || "").trim();

    if (!trimmed) return;

    let amount;
    try {
      amount = new Decimal(trimmed);
    } catch {
      this.logger.error("Invalid ATF amount:", trimmed);
      return;
    }

    if (amount.isNegative()) {
      this.logger.error("ATF amount must be non-negative");
      return;
    }

    const level = this.findLevelForAtf(amount);
    const diffData = await this.fetchDifficultyData();
    const dailyRate = this.getDailyMiningRateForLevel(level, diffData);
    const hashPower = this.getMinerHashPower(level);
    const divisor = this.getDifficultyDivisor(
      diffData.difficulty,
      level,
      diffData.exemptMinLevel,
      diffData.exemptMaxLevel,
    );

    this.logger.newline();
    this.logger.keyValue("ATF Amount", amount.toString());
    this.logger.keyValue("Reachable Level", level);
    this.logger.keyValue("Level Cost", this.getMinerCost(level).toString());
    this.logger.keyValue(
      "Hash Power",
      `${hashPower.toDecimalPlaces(2).toString()} TH/s`,
    );
    this.logger.keyValue("Difficulty", diffData.difficulty);
    this.logger.keyValue("Divisor", divisor.toDecimalPlaces(4).toString());

    this.logger.newline();
    logMiningRateBreakdown(this.logger, dailyRate);
    this.ctx.tools.logHashPowerExplainer(hashPower, divisor);
  }

  async fetchDifficultyData() {
    const data = await this.ctx.api.getDifficulty();
    return {
      difficulty: Number(data.difficulty) || 1,
      boostCycleSeconds: Number(data.boost_cycle_seconds) || 15,
      boostTapsPerSec: Number(data.boost_taps_per_sec) || 8,
      exemptMinLevel: Number(data.difficulty_exempt_min_level) || 0,
      exemptMaxLevel: Number(data.difficulty_exempt_max_level) || 0,
    };
  }

  /** Start of claim mining */
  async startOrClaimMining() {
    const { user } = this.ctx.state.data;
    if (!user["wallet_address"]) {
      this.logger.error(
        "No wallet connected. Please connect your wallet first.",
      );
      return;
    }

    const lastMiningStart = Number(user["last_mining_start"]);

    if (lastMiningStart === 0) {
      /** Start Mining */
      const challenge = await this.ctx.api.getMathChallenge("start_mine");
      const answer = this.getAnswerForChallenge(challenge.question);

      /** Delay before submitting */
      await this.utils.delayForSeconds(5, { signal: this.signal });

      const result = await this.ctx.api.startMining({
        challengeId: challenge.challenge_id,
        answer: answer.toString(),
      });

      if (result.start_time) {
        Object.assign(this.ctx.state.data.user, {
          last_mining_start: result.start_time,
          boost_active_until: 0,
          boost_power_snapshot: 0,
          mining_difficulty_snapshot: 0,
        });
        this.applyMiningState(result);
        this.logger.success("Mining started!");
      }
    } else {
      /** Claim Mining */
      const diffData = await this.fetchDifficultyData();
      const balance = this.calculateSessionBalance({
        user,
        difficulty: diffData.difficulty,
        boostCycleSeconds: diffData.boostCycleSeconds,
        exemptMinLevel: diffData.exemptMinLevel,
        exemptMaxLevel: diffData.exemptMaxLevel,
      });

      if (balance.lte(0)) {
        this.logger.warn("No rewards to claim yet.");
        return;
      }

      /** Delay before claiming */
      await this.utils.delayForSeconds(5, { signal: this.signal });

      this.logger.info(`Claiming ${balance.toString()} ATF...`);
      const result = await this.ctx.api.claimMining(balance);

      if (result.new_pool_balance !== undefined) {
        this.ctx.state.data.user["mined_balance"] = result.new_pool_balance;
        this.logger.success(
          `Claimed! Pool balance: ${result.new_pool_balance}`,
        );
      }

      /** Mining auto-restarts after claim */
      if (result.server_now) {
        Object.assign(this.ctx.state.data.user, {
          last_mining_start: result.server_now,
          pending_reward: 0,
          boost_active_until: 0,
          boost_power_snapshot: 0,
          mining_difficulty_snapshot: 0,
        });
        this.applyMiningState(result);
      }
    }
  }

  async applyBoost() {
    const { user } = this.ctx.state.data;
    const lastMiningStart = Number(user["last_mining_start"]);

    if (lastMiningStart === 0) {
      this.logger.info("Not mining. Skipping boost.");
      return;
    }

    const nowSec = Date.now() / 1000;
    const boostActiveUntil = Number(user["boost_active_until"]) || 0;

    if (boostActiveUntil > nowSec) {
      this.logger.info("Boost already active.");
      return;
    }

    /** The app keeps the boost locked until it is ready again */
    const boostReadyAt = Number(user["boost_ready_at"]) || 0;

    if (boostReadyAt > nowSec) {
      this.logger.info("Boost not ready yet.");
      return;
    }

    const diffData = await this.fetchDifficultyData();
    const balance = this.calculateSessionBalance({
      user,
      difficulty: diffData.difficulty,
      boostCycleSeconds: diffData.boostCycleSeconds,
      exemptMinLevel: diffData.exemptMinLevel,
      exemptMaxLevel: diffData.exemptMaxLevel,
    });

    /* Record navigation batch */
    await this.ctx.activity.recordNavigationBatch(1);

    /** Delay before activating */
    await this.utils.delayForSeconds(3, { signal: this.signal });

    const result = await this.ctx.api.activateBoost(balance);

    if (result.boost_active_until) {
      /** A boost settles the session into pending and opens a new segment */
      Object.assign(this.ctx.state.data.user, {
        pending_reward: balance.toNumber(),
        last_mining_start:
          Number(result.server_now) || Math.floor(Date.now() / 1000),
        boost_power_snapshot:
          Number(result.boost_taps_per_sec) || diffData.boostTapsPerSec,
        mining_difficulty_snapshot: diffData.difficulty,
      });
      this.applyMiningState(result);
      this.logger.success("Boost activated!");
    }
  }

  /** Apply the balance and level a claim hands back, keeping what it leaves out */
  applyClaimResult(result, balanceKey = "new_balance") {
    const user = this.ctx.state.data.user;

    if (result?.[balanceKey] !== undefined) {
      user["mined_balance"] = result[balanceKey];
    }
    if (result?.["new_level"] !== undefined) {
      user["miner_level"] = result["new_level"];
    }
    if (result?.["assets_total"] !== undefined) {
      user["assets_total"] = result["assets_total"];
    }
  }
}
