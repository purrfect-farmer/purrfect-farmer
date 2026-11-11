import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import {
  AGE_POINTS,
  GRAM_CURRENCY,
  MAXIMUM_SPINS_PER_RUN,
  PRIZE_KIND,
} from "./constants.js";

/** The welcome reward, the daily streak, the vault and the two wheels */
export default class MyAgeRewards extends FarmerModule {
  /** Claim the one-time welcome reward when it is still waiting */
  async claimWelcome() {
    const { state } = this.ctx;

    if (state.part("welcome")["claimed"]) {
      this.logger.info("Welcome reward already claimed.");
      return;
    }

    /* The vault and the wheels start with the welcome, so read them again */
    const result = await this.ctx.api.claimWelcome();
    const total = result["welcome"]?.["total"] ?? 0;

    await state.load();

    this.logger.success(`Claimed the welcome reward: ${total} ${AGE_POINTS}.`);
  }

  /** Claim today's daily reward when it is ready */
  async claimDaily() {
    const { state } = this.ctx;
    const daily = state.part("daily");

    if (!daily["ready"]) {
      this.logger.info("Daily reward already claimed today.");
      return;
    }

    const result = await this.ctx.api.claimDaily();

    /* Keep what the page keeps after a claim */
    state.applyBalances(result);
    daily["ready"] = false;
    daily["streak"] = result["streak"];

    this.logger.success(
      `Claimed day ${result["day"]} for ${result["reward"]} ${AGE_POINTS}.`,
    );
  }

  /** What the vault holds now, by its fill clock on the server's time */
  vaultAmount() {
    const { state } = this.ctx;
    const vault = state.part("vault");
    const hours = Number(vault["hours"]) || 0;
    const elapsed = Date.now() - this.serverOffset() - vault["startedAt"];
    const filled = Math.min(Math.max(elapsed, 0), hours * 36e5);

    return Math.floor(((Number(vault["perHour"]) || 0) * filled) / 36e5);
  }

  /** How far the local clock runs ahead of the drop's, from when the session was read */
  serverOffset() {
    const serverNow = Number(this.ctx.state.data?.["serverNow"]) || 0;

    return serverNow ? this.ctx.state.readAt - serverNow : 0;
  }

  /** Claim the vault once it holds anything, as the page allows */
  async claimVault() {
    const { state } = this.ctx;

    if (!state.data?.["vault"]) {
      this.logger.info("The vault has not opened yet.");
      return;
    }

    if (this.vaultAmount() < 1) {
      this.logger.info("The vault is empty.");
      return;
    }

    const result = await this.ctx.api.claimVault();

    /* The vault starts filling again from the claim */
    const vault = result["vault"] || state.data["vault"];
    const startedAt = Date.now() - this.serverOffset();

    state.applyBalances(result);
    state.data["vault"] = {
      ...vault,
      startedAt,
      fullAt: startedAt + vault["hours"] * 36e5,
    };

    this.logger.success(
      `Claimed the vault: ${result["amount"]} ${AGE_POINTS}.`,
    );
  }

  /** Spin the wheel while its free spin is ready or bonus spins are waiting */
  async spinWheel() {
    const { state } = this.ctx;
    const spin = state.data?.["spin"];

    if (!spin) {
      this.logger.info("The wheel has not opened yet.");
      return;
    }

    let spins = 0;

    while (
      (spin["ready"] || spin["bonus"] > 0) &&
      spins < MAXIMUM_SPINS_PER_RUN &&
      !this.signal.aborted
    ) {
      const result = await this.ctx.api.spin();

      /* The free spin is used first, then the bonus ones */
      spin["ready"] = false;
      spin["bonus"] = result["bonusLeft"] ?? 0;
      state.applyBalances(result);
      spins++;

      this.logPrize("Spin", result);
      await this.utils.delayForSeconds(2, { signal: this.signal });
    }

    if (!spins) {
      this.logger.info("No spin is ready.");
    }
  }

  /** Spin the mystery wheel for every mystery spin the account has */
  async spinMystery() {
    const { state } = this.ctx;
    const mystery = state.part("mystery");
    let spins = 0;

    while (
      mystery["left"] > 0 &&
      spins < MAXIMUM_SPINS_PER_RUN &&
      !this.signal.aborted
    ) {
      const result = await this.ctx.api.spinMystery();

      /* The reply may carry what is left; count down when it does not */
      mystery["left"] = result["left"] ?? mystery["left"] - 1;
      state.applyBalances(result);
      spins++;

      this.logPrize("Mystery spin", result);
      await this.utils.delayForSeconds(2, { signal: this.signal });
    }

    if (!spins) {
      this.logger.info("No mystery spin is waiting.");
    }
  }

  /** Log what one spin landed on */
  logPrize(label, result) {
    /* A pass is a whitelist NFT, not an amount */
    if (result["serial"]) {
      this.logger.success(`${label}: won the Whitelist Pass.`);
      return;
    }

    /* Premium is paid in months */
    if (result["kind"] === PRIZE_KIND.PREMIUM) {
      this.logger.success(
        `${label}: won ${result["amount"]} months of Premium.`,
      );
      return;
    }

    const currency =
      result["kind"] === PRIZE_KIND.GRAM ? GRAM_CURRENCY : AGE_POINTS;

    this.logger.success(
      `${label}: won ${formatAmount(result["amount"])} ${currency}.`,
    );
  }
}
