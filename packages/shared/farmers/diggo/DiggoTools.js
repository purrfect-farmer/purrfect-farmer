import Decimal from "decimal.js";
import { MINIMUM_DEPOSIT_TON } from "./constants.js";
import DiggoAccount from "./DiggoAccount.js";

/** The interactive tools the farmer offers */
export default class DiggoTools extends DiggoAccount {
  /* --------------------------------------------------------------------- */
  /* Tools (manual actions)                                                */
  /* --------------------------------------------------------------------- */

  createTools() {
    return [
      {
        name: "Wallet",
        list: [
          ...this.createAutoWalletTools(),
          {
            id: "refresh-holding",
            icon: "reconnect",
            title: "Refresh Holding",
            action: this.refreshHoldingInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "activate-withdrawals",
            icon: "kyc",
            title: "Activate Withdrawals",
            action: this.activateWithdrawalsInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "security-check",
            icon: "check",
            title: "Security Check",
            action: this.securityCheckInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "deposit-ton",
            icon: "import",
            title: "Deposit TON",
            action: this.depositTonInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "convert-ton",
            icon: "reconnect",
            title: "Convert TON",
            action: this.convertTonInteractive.bind(this),
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
            action: this.buyDiggoInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "estimate-boost",
            icon: "search",
            title: "Estimate Boost",
            action: this.estimateBoostInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "sell-diggo",
            icon: "withdraw",
            title: "Sell DIGGO",
            action: this.sellDiggoInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "market-price",
            icon: "search",
            title: "Market Price",
            action: this.marketPriceInteractive.bind(this),
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
            action: this.claimMiningInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "complete-tasks",
            icon: "check",
            title: "Complete Tasks",
            action: this.completeTasksInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "open-chests",
            icon: "key",
            title: "Open Chests",
            action: this.openChestsInteractive.bind(this),
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
            action: this.logWithdrawalStatus.bind(this),
            dispatch: false,
          },
          {
            id: "withdraw",
            icon: "withdraw",
            title: "Withdraw",
            action: this.withdrawInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "cancel-withdrawal",
            icon: "disconnect",
            title: "Cancel Withdrawal",
            action: this.cancelWithdrawalInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
    ];
  }

  /** Have the backend re-read the bound wallet's DIGGO and TON */
  async refreshHoldingInteractive() {
    await this.ensureStateLoaded();

    if (!this.getConnectedWalletAddress()) {
      this.logger.warn("Connect a wallet first.");
      return;
    }

    await this.refreshHolding();
    await this.refreshWalletBalance("ton").catch((error) =>
      this.logger.warn("Failed to refresh ton:", error.message),
    );

    const holdings = this.state_data["wallet"]?.["holdings"] || {};

    this.logger.newline();
    this.logger.keyValue(
      "Holding",
      this.formatAmount(this.state_data["holding"]),
    );
    this.logger.keyValue("Level", this.state_data["currentLevel"]);
    this.logger.keyValue("Wallet DIGGO", this.getWalletDiggo() ?? "-");
    this.logger.keyValue("Wallet TON", holdings["ton"]?.["amount"] ?? "-");
  }

  /** Buy DIGGO with TON from the bound wallet, prompting for the amount and the signing phrase */
  async buyDiggoInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();

    const paused = await this.getMarketPause();

    if (paused) {
      this.logger.warn(paused);
      return;
    }

    const minimum = this.getMinimumBuyTon();
    const amount = await this.promptAmount(
      `How much TON to spend? (minimum ${minimum})`,
    );

    if (!amount) return;

    if (new Decimal(amount).lessThan(minimum)) {
      this.logger.error(`The market takes at least ${minimum} TON.`);
      return;
    }

    const signer = await this.promptSigner();

    if (!signer) return;

    try {
      await this.buyDiggo(signer, amount);
    } catch (error) {
      this.logger.error("Failed to buy DIGGO:", error.message);
    }
  }

  /** Show what a TON buy would bring the account to, without buying */
  async estimateBoostInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();

    const amount = await this.promptAmount("How much TON?");

    if (!amount) return;

    try {
      const { quote } = await this.quoteMarket("buy", amount);
      const levels = await this.readMiningLevels();
      const current = this.findLevelForHolding(
        levels,
        Number(this.state_data["holding"]) || 0,
      );
      const target = this.findLevelForHolding(
        levels,
        (Number(this.state_data["holding"]) || 0) + Number(quote["getAmount"]),
      );

      this.logger.newline();
      this.logger.keyValue(
        "Receive",
        `${this.formatAmount(quote["getAmount"])} DIGGO`,
      );
      this.logger.keyValue("Level", `${current.level} → ${target.level}`);
      this.logger.keyValue("Speed", `${current.ths} → ${target.ths} TH/s`);
      this.logger.newline();
      this.logMiningRateBreakdown(new Decimal(target.daily));
    } catch (error) {
      this.logger.error("Failed to estimate:", error.message);
    }
  }

  /** Sell DIGGO into the in-app TON balance, prompting for the amount */
  async sellDiggoInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();

    const paused = await this.getMarketPause();

    if (paused) {
      this.logger.warn(paused);
      return;
    }

    if (!this.state_data["price"]?.["sellEnabled"]) {
      this.logger.warn("Selling is disabled right now.");
      return;
    }

    const amount = await this.promptAmount(
      `How much DIGGO? (balance ${this.formatAmount(this.state_data["balance"])})`,
    );

    if (!amount) return;

    try {
      await this.sellDiggo(amount);
    } catch (error) {
      this.logger.error("Failed to sell DIGGO:", error.message);
    }
  }

  /** Log the market's prices and the account's balances */
  async marketPriceInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();

    const price = this.state_data["price"] || {};

    this.logger.newline();
    this.logger.keyValue("DIGGO", `$${price["tokenUsd"]}`);
    this.logger.keyValue("TON", `$${price["tonUsd"]}`);
    this.logger.keyValue("DIGGO per TON", this.formatAmount(price["rate"]));
    this.logger.keyValue("Min Buy", `${this.getMinimumBuyTon()} TON`);
    this.logger.keyValue("Buy Fee", `${price["buyFeeTon"]} TON`);
    this.logger.keyValue("Sell", price["sellEnabled"] ? "Enabled" : "Disabled");
    this.logger.keyValue(
      "Balance",
      `${this.formatAmount(this.state_data["balance"])} DIGGO`,
    );
    this.logger.keyValue("In-app TON", this.formatAmount(this.getInAppTon()));
  }

  /** Deposit TON from the bound wallet, prompting for the amount and the signing phrase */
  async depositTonInteractive() {
    await this.ensureStateLoaded();

    const paused = await this.getDepositPause();

    if (paused) {
      this.logger.warn(paused);
      return;
    }

    const amount = await this.promptAmount(
      `How much TON to deposit? (minimum ${MINIMUM_DEPOSIT_TON})`,
    );

    if (!amount) return;

    if (new Decimal(amount).lessThan(MINIMUM_DEPOSIT_TON)) {
      this.logger.error(`Deposits start at ${MINIMUM_DEPOSIT_TON} TON.`);
      return;
    }

    const signer = await this.promptSigner();

    if (!signer) return;

    try {
      await this.depositTon(signer, amount);
      await this.loadState();
    } catch (error) {
      this.logger.error("Failed to deposit:", error.message);
    }
  }

  /** Claim mining on demand */
  async claimMiningInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();
    await this.claimPendingMining();
  }

  /** Work the tasks on demand */
  async completeTasksInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();
    await this.completeTasks();
    await this.claimStreak();
  }

  /** Open the chests on demand */
  async openChestsInteractive() {
    await this.ensureStateLoaded();
    await this.openChests();
  }

  /** Bind a wallet, prompting for the phrase that signs its TON proof */
  async connectWalletInteractive() {
    const input = await this.promptInput(
      "Enter your TON Wallet Phrase / Secret Key (hex):",
    );

    if (!(input || "").trim()) {
      this.logger.warn("No phrase provided.");
      return;
    }

    const version = await this.promptInput({
      type: "select",
      text: "Select wallet version:",
      options: [
        { value: "5", label: "Wallet V5R1" },
        { value: "4", label: "Wallet V4" },
      ],
    });

    if (!version) {
      this.logger.warn("No wallet version selected.");
      return;
    }

    const { status, message } = await this.connectAutoWallet({
      phrase: input,
      version,
    });

    if (!status) {
      this.logger.error("Failed to bind the wallet:", message);
    }
  }

  /** The game has no unbind, so a bound wallet stays for good */
  async disconnectWalletInteractive() {
    await this.ensureStateLoaded();

    const address = this.getConnectedWalletAddress();

    if (!address) {
      this.logger.info("No wallet connected.");
      return;
    }

    this.logger.warn(`Diggo binds ${address} for good, it cannot be unbound.`);
  }

  /** Pay the one-time withdrawal activation, prompting for the signing phrase */
  async activateWithdrawalsInteractive() {
    await this.ensureStateLoaded();

    if (!this.getConnectedWalletAddress()) {
      this.logger.warn("Connect a wallet first.");
      return;
    }

    const activation = await this.loadActivation();

    this.logger.keyValue("Activation", this.describeActivation(activation));

    if (this.isActivated(activation) || !this.canPayActivation(activation)) {
      return;
    }

    const signer = await this.promptSigner();

    if (!signer) return;

    try {
      const { status, message } = await this.payActivation(signer);

      this.logger[status ? "success" : "warn"](message);
    } catch (error) {
      this.logger.error("Failed to activate withdrawals:", error.message);
    }
  }

  /** Clear a pending security check on demand */
  async securityCheckInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();

    try {
      await this.clearRiskChallenge();
    } catch (error) {
      this.logger.error("Failed the security check:", error.message);
    }
  }

  /** Convert the in-app TON balance into DIGGO on demand */
  async convertTonInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();

    try {
      await this.convertTon();
    } catch (error) {
      this.logger.error("Failed to convert:", error.message);
    }
  }

  /** Cancel a withdrawal the history still marks cancelable */
  async cancelWithdrawalInteractive() {
    await this.ensureStateLoaded();

    const cancelable = (await this.getWithdrawals()).filter(
      (item) => item["cancelable"],
    );

    if (!cancelable.length) {
      this.logger.info("No withdrawal to cancel.");
      return;
    }

    const id = await this.promptInput({
      type: "select",
      text: "Cancel which withdrawal?",
      options: cancelable.map((item) => ({
        value: item["id"],
        label: `${item["amount"]} DIGGO · ${item["status"]} · ${new Date(item["createdAt"] || Date.now()).toLocaleString()}`,
      })),
    });

    if (!id) return;

    try {
      await this.cancelWithdrawal(id);
      this.logger.success("Withdrawal cancelled.");
    } catch (error) {
      this.logger.error("Failed to cancel:", error.message);
    }
  }
}
