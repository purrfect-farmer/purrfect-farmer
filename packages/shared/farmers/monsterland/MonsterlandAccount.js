import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount, logCurrentUser } from "../../lib/farmer/format.js";

/** What the account looks like, as logged before a pass */
export default class MonsterlandAccount extends FarmerModule {
  /** Log what the account looks like before the pass starts */
  logInfo() {
    const profile = this.ctx.state.profile();
    const streak = profile["daily_streak_state"] || {};
    const payments = profile["payments"] || {};
    const monsters = this.ctx.care.getLiveMonsters();

    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue("Lumis", formatAmount(this.ctx.state.lumis()));
    this.logger.keyValue("Level", profile["level"] ?? "-");
    this.logger.keyValue("Streak", `${streak["days"] ?? 0} day(s)`);
    this.logger.keyValue(
      "Referrals",
      this.ctx.state.data?.referral?.["total_referrals"] ?? 0,
    );
    this.logger.keyValue(
      "Withdrawal Fee",
      payments["withdrawal_fee"] !== undefined
        ? `${payments["withdrawal_fee"]}%`
        : "-",
    );
    this.logger.keyValue("Wallet", payments["wallet"] || "Not connected", {
      valueStyle: payments["wallet"]
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });

    this.logger.newline();
    this.logger.keyValue("Monsters", monsters.length);

    for (const monster of monsters) {
      const vitals = this.ctx.care.projectVitals(monster);

      this.logger.keyValue(
        monster["name"] || monster["_id"],
        `Lv ${monster["level"] ?? 1} | 🍎 ${Math.round(vitals.food)} 🧼 ${Math.round(vitals.hygiene)} ⚡ ${Math.round(vitals.energy)}${monster["is_sleeping"] ? " | 💤" : ""}`,
      );
    }
  }
}
