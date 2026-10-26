import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import { sendTonConnectTransaction } from "../../lib/ton/tonConnect.js";
import {
  MINIMUM_BUY_TON,
  MINING_LEVELS_URL,
  PAYMENT_CHECK_ATTEMPTS,
  PAYMENT_CHECK_INTERVAL_SECONDS,
  PAYMENT_GAS_TON,
  SETTLED_ORDER_STATUSES,
} from "./constants.js";

/** Buying, selling and depositing through the game's market */
export default class DiggoMarket extends FarmerModule {
  /** The mining levels, read once */
  miningLevels = null;

  /** The smallest buy the market takes, in TON */
  getMinimumBuyTon() {
    return (
      Number(this.ctx.state.data?.["price"]?.["minBuyTon"]) || MINIMUM_BUY_TON
    );
  }

  /** The page's level table, fetched once per run */
  async readMiningLevels() {
    if (this.miningLevels) return this.miningLevels;

    const { data } = await this.api.get(MINING_LEVELS_URL, {
      signal: this.signal,
    });

    return (this.miningLevels = (data?.["levels"] || []).map((row) => ({
      level: row["level"],
      holding: row["holdingUnits"] / 1e6,
      ths: row["thsCenti"] / 100,
      daily: row["dailyUnits"] / 1e6,
    })));
  }

  /** The highest level a holding reaches */
  findLevelForHolding(levels, holding) {
    return levels.reduce(
      (best, row) => (holding >= row.holding ? row : best),
      levels[0],
    );
  }

  /** Send the server's TonConnect transaction from the bound wallet, checking it can be afforded */
  payTonTransaction(signer, transaction) {
    return sendTonConnectTransaction(signer.wallet, transaction, {
      gasTon: PAYMENT_GAS_TON,
      signal: this.signal,
    });
  }

  /** Buy DIGGO with TON from the bound wallet, which raises the holding and with it the level */
  async buyDiggo(signer, tonAmount) {
    const { quote } = await this.ctx.api.quoteMarket("buy", tonAmount);

    this.logger.newline();
    this.logger.keyValue("Pay", `${quote["payAmount"]} TON`);
    this.logger.keyValue("Fee", `${quote["fee"]} TON`);
    this.logger.keyValue(
      quote["estimated"] ? "Est. Receive" : "Receive",
      `${formatAmount(quote["getAmount"])} DIGGO`,
    );
    this.logger.keyValue("Price Impact", `${quote["priceImpact"]}%`);

    const { order } = await this.ctx.api.createTonOrder(
      quote["id"],
      quote["execution"] || "protected",
    );

    if (order["status"] === "pending") {
      try {
        await this.payTonTransaction(signer, order["transaction"]);
      } catch (error) {
        await this.ctx.api
          .stageTonOrder(order["id"], "rejected")
          .catch(() => null);
        throw error;
      }

      await this.ctx.api.stageTonOrder(order["id"], "submitted");
      this.logger.info("Payment sent, waiting for the game to confirm it...");
    }

    const settled = await this.waitForPayment(
      () =>
        this.ctx.api
          .fetchTonOrder(order["id"])
          .then((result) => result["order"]),
      order,
    );

    if (settled["status"] === "paid") {
      await this.ctx.state.load();
      this.logger.success(
        `Bought DIGGO, holding ${formatAmount(this.ctx.state.data["holding"])} at level ${this.ctx.state.data["currentLevel"]}.`,
      );
    }

    return settled;
  }

  /** Sell DIGGO into the in-app TON balance */
  async sellDiggo(amount) {
    const { quote } = await this.ctx.api.quoteMarket("sell", amount);

    this.logger.newline();
    this.logger.keyValue("Sell", `${quote["payAmount"]} DIGGO`);
    this.logger.keyValue("Receive", `${quote["getAmount"]} TON`);
    this.logger.keyValue("Min Received", `${quote["minReceived"]} TON`);

    const { trade } = await this.ctx.api.executeTrade(quote["id"]);

    this.logger.success(
      `Sold ${trade?.["diggo"] ?? amount} DIGGO for ${trade?.["ton"] ?? quote["getAmount"]} TON.`,
    );
  }

  /** Deposit TON from the bound wallet into the in-app TON balance */
  async depositTon(signer, tonAmount) {
    const { deposit } = await this.ctx.api.createDeposit(tonAmount);

    if (deposit["status"] === "pending") {
      const { deposit: invoice } = await this.ctx.api.fetchDeposit(
        deposit["id"],
      );

      try {
        await this.payTonTransaction(signer, invoice["transaction"]);
      } catch (error) {
        await this.ctx.api
          .stageDeposit(deposit["id"], "rejected")
          .catch(() => null);
        throw error;
      }

      await this.ctx.api.stageDeposit(deposit["id"], "submitted");
      this.logger.info("Deposit sent, waiting for the game to confirm it...");
    }

    return this.waitForPayment(async () => {
      const { deposits } = await this.ctx.api.fetchDeposits();

      return (
        (deposits || []).find((item) => item["id"] === deposit["id"]) || deposit
      );
    }, deposit);
  }

  /** Poll an order or deposit until it settles, logging how it ended */
  async waitForPayment(read, initial) {
    let current = initial;

    for (let attempt = 0; attempt < PAYMENT_CHECK_ATTEMPTS; attempt++) {
      if (SETTLED_ORDER_STATUSES.includes(current["status"])) break;

      await this.utils.delayForSeconds(PAYMENT_CHECK_INTERVAL_SECONDS, {
        signal: this.signal,
      });

      current = await read();
    }

    if (current["status"] === "paid") {
      this.logger.success("Payment confirmed.");
    } else {
      this.logger.warn(
        `Payment is ${current["status"]}${current["reason"] ? ` (${current["reason"]})` : ""}.`,
      );
    }

    return current;
  }
}
