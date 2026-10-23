import {
  MINE_DAILY_LOSS_LIMIT,
  MINE_MOVE_DELAY_SECONDS,
  UNDERGROUND_GAMES,
} from "./constants.js";
import {
  MINIMUM_PAYOUT_DIAL,
  chooseMove,
  getStartCap,
  pickTool,
} from "../../lib/games/deepMine.js";

/** Trait: deep Mine runs and the Underground report */
export default class VictorsArcade {
  /* --------------------------------------------------------------------- */
  /* Arcade                                                                */
  /* --------------------------------------------------------------------- */

  /** Play Deep Mine's daily runs, finishing any run left open first */
  async playArcade() {
    const arcade = await this.fetchArcade();
    const game = (arcade["games"] || []).find(
      (item) => item["id"] === "mine" && !item["test"],
    );

    for (const item of arcade["games"] || []) {
      if (
        item["id"] !== "mine" &&
        !UNDERGROUND_GAMES.includes(item["id"]) &&
        !item["test"]
      ) {
        this.logger.warn(`Unknown arcade game "${item["id"]}" is public.`);
      }
    }

    const dial = Number(game?.["payout"] ?? 100);

    if (arcade["mine"]?.["status"] === "active") {
      this.logger.info("Resuming the Deep Mine run in progress...");
      await this.recordMineResult(
        arcade,
        await this.playMineRun(arcade["mine"], dial),
      );
    }

    if (!game) {
      this.logger.info("Deep Mine is not open.");
      return;
    }

    if (dial < MINIMUM_PAYOUT_DIAL) {
      this.logger.info(`Deep Mine pays ${dial}%, too little to play.`);
      return;
    }

    let playsLeft = Number(game["playsLeft"]) || 0;

    while (playsLeft > 0 && !this.signal.aborted) {
      const balance = Number(this.getUserDetails()["inAppBalance"]) || 0;
      const tool = pickTool(balance);

      if (!tool) {
        this.logger.info("Not enough balance for Deep Mine gear.");
        break;
      }

      const net = await this.getArcadeNet(arcade["resetsAt"]);

      if (net <= -MINE_DAILY_LOSS_LIMIT) {
        this.logger.warn(`Deep Mine lost ${net.toFixed(1)} VIC today, done.`);
        break;
      }

      const started = await this.startMineRun(tool);

      if (started?.["success"] === false || !started?.["run"]) {
        this.logger.warn("Failed to start Deep Mine:", started?.["error"]);
        break;
      }

      this.applyResult(started);

      /** A fresh run's cap moves with the bag cap and refund rate, so a mismatch means the rules changed */
      if (Number(started["run"]["cap"]) !== getStartCap(tool)) {
        this.logger.warn(
          `Deep Mine rules changed (cap ${started["run"]["cap"]}, expected ${getStartCap(tool)}), climbing out.`,
        );
        await this.recordMineResult(arcade, await this.endMineRun());
        break;
      }

      this.logger.info(
        `Deep Mine run with ${tool} at ${dial}% payout, ${playsLeft - 1} left after this.`,
      );

      await this.recordMineResult(
        arcade,
        await this.playMineRun(started["run"], dial),
      );
      playsLeft--;
    }
  }

  /** Dig a run to its end as the solver directs, returning the final response */
  async playMineRun(run, dial) {
    let response = { run };

    while (response?.["run"]?.["status"] === "active") {
      if (this.signal.aborted) return null;

      const move = chooseMove(response["run"], { dial });

      if (move.action === "end") {
        response = await this.endMineRun();
      } else if (move.action === "dig") {
        response = await this.digMine(move.x, move.y);
      } else {
        response = await this.useMineItem(move.action, move.x, move.y);
      }

      if (response?.["success"] === false) {
        this.logger.warn("Deep Mine move refused:", response["error"]);

        /** A refused move leaves the run as it was, so climb out with what is in the bag */
        response = await this.endMineRun();

        if (response?.["success"] === false) {
          this.logger.error("Failed to end the run:", response["error"]);
          return null;
        }
      }

      await this.utils.delayForSeconds(MINE_MOVE_DELAY_SECONDS, {
        signal: this.signal,
      });
    }

    return response;
  }

  /** Log a finished run and add its net to today's total */
  async recordMineResult(arcade, response) {
    const result = response?.["result"] || response?.["run"]?.["result"];

    if (!result) return;

    this.applyResult(response);

    const net = Number(result["net"]) || 0;
    const total = (await this.getArcadeNet(arcade["resetsAt"])) + net;

    await this.storage?.set("arcadeNet", {
      day: arcade["resetsAt"],
      net: total,
    });

    const log = net >= 0 ? "success" : "warn";

    this.logger[log](
      `Deep Mine ended (${result["reason"]}): paid ${result["paid"]} for ${result["spent"]}, net ${net >= 0 ? "+" : ""}${net}, today ${total.toFixed(1)} VIC.`,
    );
  }

  /** Report Underground's pools and plays left, it is played live and never farmed */
  async logUnderground() {
    const underground = await this.fetchUnderground();
    const profile = underground?.["profile"] || {};

    for (const id of UNDERGROUND_GAMES) {
      const today = underground?.["games"]?.[id]?.["today"];

      if (!today || profile["test"]?.[id]) continue;

      this.logger.keyValue(
        id === "crew" ? "Crew Pool" : "Rush Pool",
        `${this.formatAmount(today["pool"])} (share ${today["share"] ?? 0}, ${profile["playsLeft"]?.[id] ?? 0} plays left)`,
      );
    }
  }

  /** Today's Deep Mine net, as stored for the day the arcade resets at */
  async getArcadeNet(day) {
    const stored = await this.storage?.get("arcadeNet");

    return stored?.["day"] === day ? Number(stored["net"]) || 0 : 0;
  }
}
