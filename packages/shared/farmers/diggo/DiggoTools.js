import FarmerModule from "../../lib/farmer/FarmerModule.js";
import {
  formatAmount,
  logMiningRateBreakdown,
} from "../../lib/farmer/format.js";
import { MINIMUM_DEPOSIT_TON } from "./constants.js";
import Decimal from "decimal.js";
import createAutoWalletTools from "../../lib/farmer/autoWalletTools.js";
import { promptWalletVersion } from "../../lib/farmer/prompts.js";

/** The interactive tools the farmer offers */
export default class DiggoTools extends FarmerModule {
  create() {
    return [
      {
        name: "Wallet",
        list: [
          ...createAutoWalletTools({
            connect: () => this.connectWalletInteractive(),
            disconnect: () => this.disconnectWalletInteractive(),
            prompts: this.ctx.connectPrompts,
          }),
          {
            id: "refresh-holding",
            icon: "reconnect",
            title: "Refresh Holding",
            action: () => this.refreshHoldingInteractive(),
            dispatch: false,
          },
          {
            id: "activate-withdrawals",
            icon: "kyc",
            title: "Activate Withdrawals",
            action: () => this.activateWithdrawalsInteractive(),
            dispatch: false,
          },
          {
            id: "security-check",
            icon: "check",
            title: "Security Check",
            action: () => this.securityCheckInteractive(),
            dispatch: false,
          },
          {
            id: "deposit-ton",
            icon: "import",
            title: "Deposit TON",
            action: () => this.depositTonInteractive(),
            dispatch: false,
          },
          {
            id: "convert-ton",
            icon: "reconnect",
            title: "Convert TON",
            action: () => this.convertTonInteractive(),
            dispatch: false,
          },
        ],
      },
      {
        name: "Boost",
        list: [
          {
            id: "buy-diggo",
            icon: "import",
            title: "Buy DIGGO",
            action: () => this.buyDiggoInteractive(),
            dispatch: false,
          },
          {
            id: "estimate-boost",
            icon: "search",
            title: "Estimate Boost",
            action: () => this.estimateBoostInteractive(),
            dispatch: false,
          },
          {
            id: "sell-diggo",
            icon: "withdraw",
            title: "Sell DIGGO",
            action: () => this.sellDiggoInteractive(),
            dispatch: false,
          },
          {
            id: "market-price",
            icon: "search",
            title: "Market Price",
            action: () => this.marketPriceInteractive(),
            dispatch: false,
          },
        ],
      },
      {
        name: "Mining",
        list: [
          {
            id: "claim-mining",
            icon: "check",
            title: "Claim Mining",
            action: () => this.claimMiningInteractive(),
            dispatch: false,
          },
          {
            id: "complete-tasks",
            icon: "check",
            title: "Complete Tasks",
            action: () => this.completeTasksInteractive(),
            dispatch: false,
          },
          {
            id: "open-chests",
            icon: "key",
            title: "Open Chests",
            action: () => this.openChestsInteractive(),
            dispatch: false,
          },
        ],
      },
      {
        name: "Withdrawal",
        list: [
          {
            id: "withdrawal-status",
            icon: "history",
            title: "Withdrawal Status",
            action: () => this.ctx.withdrawal.logStatus(),
            dispatch: false,
          },
          {
            id: "withdraw",
            icon: "withdraw",
            title: "Withdraw",
            action: () => this.ctx.flow.withdrawInteractive(),
            dispatch: false,
          },
          {
            id: "cancel-withdrawal",
            icon: "disconnect",
            title: "Cancel Withdrawal",
            action: () => this.cancelWithdrawalInteractive(),
            dispatch: false,
          },
        ],
      },
    ];
  }

  /** Have the backend re-read the bound wallet's DIGGO and TON */
  async refreshHoldingInteractive() {
    await this.ctx.state.ensureLoaded();

    if (!this.ctx.wallet.getConnectedWalletAddress()) {
      this.logger.warn("Connect a wallet first.");
      return;
    }

    await this.ctx.wallet.refreshHolding();
    await this.ctx.api
      .refreshWalletBalance("ton")
      .catch((error) =>
        this.logger.warn("Failed to refresh ton:", error.message),
      );

    const holdings = this.ctx.state.data["wallet"]?.["holdings"] || {};

    this.logger.newline();
    this.logger.keyValue(
      "Holding",
      formatAmount(this.ctx.state.data["holding"]),
    );
    this.logger.keyValue("Level", this.ctx.state.data["currentLevel"]);
    this.logger.keyValue(
      "Wallet DIGGO",
      this.ctx.wallet.getWalletDiggo() ?? "-",
    );
    this.logger.keyValue("Wallet TON", holdings["ton"]?.["amount"] ?? "-");
  }

  /** Buy DIGGO with TON from the bound wallet, prompting for the amount and the signing phrase */
  async buyDiggoInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.state.load();

    const paused = await this.ctx.state.getMarketPause();

    if (paused) {
      this.logger.warn(paused);
      return;
    }

    const minimum = this.ctx.market.getMinimumBuyTon();
    const amount = await this.ctx.wallet.promptAmount(
      `How much TON to spend? (minimum ${minimum})`,
    );

    if (!amount) return;

    if (new Decimal(amount).lessThan(minimum)) {
      this.logger.error(`The market takes at least ${minimum} TON.`);
      return;
    }

    const signer = await this.ctx.wallet.promptSigner();

    if (!signer) return;

    try {
      await this.ctx.market.buyDiggo(signer, amount);
    } catch (error) {
      this.logger.error("Failed to buy DIGGO:", error.message);
    }
  }

  /** Show what a TON buy would bring the account to, without buying */
  async estimateBoostInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.state.load();

    const amount = await this.ctx.wallet.promptAmount("How much TON?");

    if (!amount) return;

    try {
      const { quote } = await this.ctx.api.quoteMarket("buy", amount);
      const levels = await this.ctx.market.readMiningLevels();
      const current = this.ctx.market.findLevelForHolding(
        levels,
        Number(this.ctx.state.data["holding"]) || 0,
      );
      const target = this.ctx.market.findLevelForHolding(
        levels,
        (Number(this.ctx.state.data["holding"]) || 0) +
          Number(quote["getAmount"]),
      );

      this.logger.newline();
      this.logger.keyValue(
        "Receive",
        `${formatAmount(quote["getAmount"])} DIGGO`,
      );
      this.logger.keyValue("Level", `${current.level} → ${target.level}`);
      this.logger.keyValue("Speed", `${current.ths} → ${target.ths} TH/s`);
      this.logger.newline();
      logMiningRateBreakdown(this.logger, new Decimal(target.daily));
    } catch (error) {
      this.logger.error("Failed to estimate:", error.message);
    }
  }

  /** Sell DIGGO into the in-app TON balance, prompting for the amount */
  async sellDiggoInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.state.load();

    const paused = await this.ctx.state.getMarketPause();

    if (paused) {
      this.logger.warn(paused);
      return;
    }

    if (!this.ctx.state.data["price"]?.["sellEnabled"]) {
      this.logger.warn("Selling is disabled right now.");
      return;
    }

    const amount = await this.ctx.wallet.promptAmount(
      `How much DIGGO? (balance ${formatAmount(this.ctx.state.data["balance"])})`,
    );

    if (!amount) return;

    try {
      await this.ctx.market.sellDiggo(amount);
    } catch (error) {
      this.logger.error("Failed to sell DIGGO:", error.message);
    }
  }

  /** Log the market's prices and the account's balances */
  async marketPriceInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.state.load();

    const price = this.ctx.state.data["price"] || {};

    this.logger.newline();
    this.logger.keyValue("DIGGO", `$${price["tokenUsd"]}`);
    this.logger.keyValue("TON", `$${price["tonUsd"]}`);
    this.logger.keyValue("DIGGO per TON", formatAmount(price["rate"]));
    this.logger.keyValue(
      "Min Buy",
      `${this.ctx.market.getMinimumBuyTon()} TON`,
    );
    this.logger.keyValue("Buy Fee", `${price["buyFeeTon"]} TON`);
    this.logger.keyValue("Sell", price["sellEnabled"] ? "Enabled" : "Disabled");
    this.logger.keyValue(
      "Balance",
      `${formatAmount(this.ctx.state.data["balance"])} DIGGO`,
    );
    this.logger.keyValue(
      "In-app TON",
      formatAmount(this.ctx.wallet.getInAppTon()),
    );
  }

  /** Deposit TON from the bound wallet, prompting for the amount and the signing phrase */
  async depositTonInteractive() {
    await this.ctx.state.ensureLoaded();

    const paused = await this.ctx.state.getDepositPause();

    if (paused) {
      this.logger.warn(paused);
      return;
    }

    const amount = await this.ctx.wallet.promptAmount(
      `How much TON to deposit? (minimum ${MINIMUM_DEPOSIT_TON})`,
    );

    if (!amount) return;

    if (new Decimal(amount).lessThan(MINIMUM_DEPOSIT_TON)) {
      this.logger.error(`Deposits start at ${MINIMUM_DEPOSIT_TON} TON.`);
      return;
    }

    const signer = await this.ctx.wallet.promptSigner();

    if (!signer) return;

    try {
      await this.ctx.market.depositTon(signer, amount);
      await this.ctx.state.load();
    } catch (error) {
      this.logger.error("Failed to deposit:", error.message);
    }
  }

  /** Claim mining on demand */
  async claimMiningInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.state.load();
    await this.ctx.tasks.claimPendingMining();
  }

  /** Work the tasks on demand */
  async completeTasksInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.state.load();
    await this.ctx.tasks.completeTasks();
    await this.ctx.tasks.claimStreak();
  }

  /** Open the chests on demand */
  async openChestsInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.tasks.openChests();
  }

  /** Bind a wallet, prompting for the phrase that signs its TON proof */
  async connectWalletInteractive() {
    const input = await this.core.prompt(
      "Enter your TON Wallet Phrase / Secret Key (hex):",
    );

    if (!(input || "").trim()) {
      this.logger.warn("No phrase provided.");
      return;
    }

    const version = await promptWalletVersion(this.core);

    if (!version) {
      this.logger.warn("No wallet version selected.");
      return;
    }

    const { status, message } = await this.ctx.auto.connectWallet({
      phrase: input,
      version,
    });

    if (!status) {
      this.logger.error("Failed to bind the wallet:", message);
    }
  }

  /** The game has no unbind, so a bound wallet stays for good */
  async disconnectWalletInteractive() {
    await this.ctx.state.ensureLoaded();

    const address = this.ctx.wallet.getConnectedWalletAddress();

    if (!address) {
      this.logger.info("No wallet connected.");
      return;
    }

    this.logger.warn(`Diggo binds ${address} for good, it cannot be unbound.`);
  }

  /** Pay the one-time withdrawal activation, prompting for the signing phrase */
  async activateWithdrawalsInteractive() {
    await this.ctx.state.ensureLoaded();

    if (!this.ctx.wallet.getConnectedWalletAddress()) {
      this.logger.warn("Connect a wallet first.");
      return;
    }

    const activation = await this.ctx.activation.loadActivation();

    this.logger.keyValue(
      "Activation",
      this.ctx.activation.describeActivation(activation),
    );

    if (
      this.ctx.activation.isActivated(activation) ||
      !this.ctx.activation.canPayActivation(activation)
    ) {
      return;
    }

    const signer = await this.ctx.wallet.promptSigner();

    if (!signer) return;

    try {
      const { status, message } =
        await this.ctx.activation.payActivation(signer);

      this.logger[status ? "success" : "warn"](message);
    } catch (error) {
      this.logger.error("Failed to activate withdrawals:", error.message);
    }
  }

  /** Clear a pending security check on demand */
  async securityCheckInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.state.load();

    try {
      await this.ctx.risk.clear();
    } catch (error) {
      this.logger.error("Failed the security check:", error.message);
    }
  }

  /** Convert the in-app TON balance into DIGGO on demand */
  async convertTonInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.state.load();

    try {
      await this.ctx.wallet.convertTon();
    } catch (error) {
      this.logger.error("Failed to convert:", error.message);
    }
  }

  /** Cancel a withdrawal the history still marks cancelable */
  async cancelWithdrawalInteractive() {
    await this.ctx.state.ensureLoaded();

    const cancelable = (await this.ctx.withdrawal.getWithdrawals()).filter(
      (item) => item["cancelable"],
    );

    if (!cancelable.length) {
      this.logger.info("No withdrawal to cancel.");
      return;
    }

    const id = await this.core.prompt({
      type: "select",
      text: "Cancel which withdrawal?",
      options: cancelable.map((item) => ({
        value: item["id"],
        label: `${item["amount"]} DIGGO · ${item["status"]} · ${new Date(item["createdAt"] || Date.now()).toLocaleString()}`,
      })),
    });

    if (!id) return;

    try {
      await this.ctx.api.cancelWithdrawal(id);
      this.logger.success("Withdrawal cancelled.");
    } catch (error) {
      this.logger.error("Failed to cancel:", error.message);
    }
  }
}
