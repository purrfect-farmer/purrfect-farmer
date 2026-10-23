import {
  MINIMUM_BUY_TON,
  MINING_LEVELS_URL,
  PAYMENT_CHECK_ATTEMPTS,
  PAYMENT_CHECK_INTERVAL_SECONDS,
  PAYMENT_GAS_TON,
  SETTLED_ORDER_STATUSES,
} from "./constants.js";
import Decimal from "decimal.js";
import { Address, Cell } from "@ton/core";

/** Trait: buying, selling and depositing through the in-app market */
export default class DiggoMarket {
  /* --------------------------------------------------------------------- */
  /* Market                                                                */
  /* --------------------------------------------------------------------- */

  /** The smallest buy the market takes, in TON */
  getMinimumBuyTon() {
    return Number(this.state_data?.["price"]?.["minBuyTon"]) || MINIMUM_BUY_TON;
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
  async payTonTransaction(signer, transaction) {
    const messages = transaction?.["messages"] || [];

    if (!messages.length) {
      throw new Error("The order carries no transaction");
    }

    const total = messages.reduce(
      (sum, message) => sum + BigInt(message["amount"]),
      0n,
    );
    const totalTon = new Decimal(total.toString()).div(1e9);
    const balance = await signer.wallet
      .getBalance({ signal: this.signal })
      .catch(() => new Decimal(0));

    if (balance.lessThan(totalTon.plus(PAYMENT_GAS_TON))) {
      throw new Error(
        `Needs ${totalTon.plus(PAYMENT_GAS_TON)} TON, the wallet holds ${balance}`,
      );
    }

    const seqno = await signer.wallet.send(
      messages.map((message) => ({
        to: Address.parse(message["address"]),
        value: BigInt(message["amount"]),
        body: message["payload"]
          ? Cell.fromBase64(message["payload"])
          : undefined,
      })),
    );

    await signer.wallet.waitForConfirmation(seqno);

    return totalTon;
  }

  /** Buy DIGGO with TON from the bound wallet, which raises the holding and with it the level */
  async buyDiggo(signer, tonAmount) {
    const { quote } = await this.quoteMarket("buy", tonAmount);

    this.logger.newline();
    this.logger.keyValue("Pay", `${quote["payAmount"]} TON`);
    this.logger.keyValue("Fee", `${quote["fee"]} TON`);
    this.logger.keyValue(
      quote["estimated"] ? "Est. Receive" : "Receive",
      `${this.formatAmount(quote["getAmount"])} DIGGO`,
    );
    this.logger.keyValue("Price Impact", `${quote["priceImpact"]}%`);

    const { order } = await this.createTonOrder(
      quote["id"],
      quote["execution"] || "protected",
    );

    if (order["status"] === "pending") {
      try {
        await this.payTonTransaction(signer, order["transaction"]);
      } catch (error) {
        await this.stageTonOrder(order["id"], "rejected").catch(() => null);
        throw error;
      }

      await this.stageTonOrder(order["id"], "submitted");
      this.logger.info("Payment sent, waiting for the game to confirm it...");
    }

    const settled = await this.waitForPayment(
      () => this.fetchTonOrder(order["id"]).then((result) => result["order"]),
      order,
    );

    if (settled["status"] === "paid") {
      await this.loadState();
      this.logger.success(
        `Bought DIGGO, holding ${this.formatAmount(this.state_data["holding"])} at level ${this.state_data["currentLevel"]}.`,
      );
    }

    return settled;
  }

  /** Sell DIGGO into the in-app TON balance */
  async sellDiggo(amount) {
    const { quote } = await this.quoteMarket("sell", amount);

    this.logger.newline();
    this.logger.keyValue("Sell", `${quote["payAmount"]} DIGGO`);
    this.logger.keyValue("Receive", `${quote["getAmount"]} TON`);
    this.logger.keyValue("Min Received", `${quote["minReceived"]} TON`);

    const { trade } = await this.executeTrade(quote["id"]);

    this.logger.success(
      `Sold ${trade?.["diggo"] ?? amount} DIGGO for ${trade?.["ton"] ?? quote["getAmount"]} TON.`,
    );
  }

  /** Deposit TON from the bound wallet into the in-app TON balance */
  async depositTon(signer, tonAmount) {
    const { deposit } = await this.createDeposit(tonAmount);

    if (deposit["status"] === "pending") {
      const { deposit: invoice } = await this.fetchDeposit(deposit["id"]);

      try {
        await this.payTonTransaction(signer, invoice["transaction"]);
      } catch (error) {
        await this.stageDeposit(deposit["id"], "rejected").catch(() => null);
        throw error;
      }

      await this.stageDeposit(deposit["id"], "submitted");
      this.logger.info("Deposit sent, waiting for the game to confirm it...");
    }

    return this.waitForPayment(async () => {
      const { deposits } = await this.fetchDeposits();

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
