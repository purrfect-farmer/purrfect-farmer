import { keyPairFromPhraseOrSecretKey } from "../../lib/ton/wallet.js";
import Decimal from "decimal.js";
import FarmerModule from "../../lib/farmer/FarmerModule.js";
import createAutoWalletTools from "../../lib/farmer/autoWalletTools.js";
import {
  formatAmount,
  logMiningRateBreakdown,
} from "../../lib/farmer/format.js";
import { promptAmount, promptWalletVersion } from "../../lib/farmer/prompts.js";
import { findSliderX } from "../../lib/sliderCaptcha.js";
import { MAXIMUM_MINER_LEVEL } from "../../lib/auto/minerCurve.js";

/** The interactive tools the farmer offers */
export default class MRGTools extends FarmerModule {
  /* --------------------------------------------------------------------- */
  /* Tools (manual actions)                                                */
  /* --------------------------------------------------------------------- */

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
            action: () => this.refreshHolding(),
            dispatch: false,
          },
          {
            id: "report-balance",
            icon: "import",
            title: "Report Balance",
            action: () => this.reportBalanceInteractive(),
            dispatch: false,
          },
          {
            id: "verify-wallet",
            icon: "kyc",
            title: "Verify Wallet",
            action: () => this.verifyWalletInteractive(),
            dispatch: false,
          },
          {
            id: "check-verification",
            icon: "kyc",
            title: "Check Verification",
            action: () => this.checkVerificationInteractive(),
            dispatch: false,
          },
          {
            id: "nft-holdings",
            icon: "search",
            title: "NFT Holdings",
            action: () => this.logNftHoldings(),
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
            id: "daily-checkin",
            icon: "check",
            title: "Daily Check-In",
            action: () => this.checkInInteractive(),
            dispatch: false,
          },
          {
            id: "estimate-mining",
            icon: "search",
            title: "Estimate Mining",
            action: () => this.estimateMining(),
            dispatch: false,
          },
        ],
      },
      {
        name: "Levels",
        list: [
          {
            id: "unlock-level",
            icon: "key",
            title: "Unlock Level",
            action: () => this.unlockLevelInteractive(),
            dispatch: false,
          },
        ],
      },
      {
        name: "Account",
        list: [
          {
            id: "human-check",
            icon: "kyc",
            title: "Human Check",
            action: () => this.ctx.humanCheck.renew(),
            dispatch: false,
          },
          {
            id: "reset-human-check",
            icon: "reconnect",
            title: "Reset Human Check",
            action: () => this.ctx.humanCheck.reset(),
            dispatch: false,
          },
        ],
      },
      {
        name: "Withdrawal",
        list: [
          {
            id: "inspect-captcha",
            icon: "search",
            title: "Inspect Captcha",
            action: () => this.inspectCaptcha(),
            dispatch: false,
          },
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
        ],
      },
    ];
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

    const keyPair = await keyPairFromPhraseOrSecretKey(input);
    const version = await promptWalletVersion(this.core);

    await this.ctx.state.ensureLoaded();

    const { status } = await this.ctx.wallet.connectSignedWallet(
      keyPair,
      version,
    );

    if (status) {
      await this.ctx.walletVersion.remember(version);
      await this.ctx.mining.unlockAffordableLevel();
    }
  }

  /** Unbind the wallet the account is on */
  async disconnectWalletInteractive() {
    await this.ctx.state.ensureLoaded();

    if (!this.ctx.wallet.getConnectedWalletAddress()) {
      this.logger.info("No wallet connected.");
      return;
    }

    const result = await this.ctx.api.disconnectWallet();

    if (!result?.["success"]) {
      this.logger.error(
        "Failed to disconnect:",
        result?.["error"] || "Unknown error",
      );
      return;
    }

    this.ctx.nft.reset();
    await this.ctx.walletVersion.remember(undefined);
    await this.ctx.state.load();
    this.logger.success("Wallet disconnected.");
  }

  /** Unlock what the derived wallet covers, then pay its verification since the phrase is known */
  async afterDerivedWalletConnected({ phrase, version } = {}) {
    await this.ctx.mining.unlockAffordableLevel();

    if (!phrase || this.ctx.account.isAccountVerified(this.ctx.state.user())) {
      return;
    }

    const { status, message } = await this.ctx.wallet.verifyWalletIfNeeded({
      phrase,
      version,
    });

    if (!status) {
      this.logger.warn("Account not verified:", message || "not confirmed yet");
    }
  }

  /** Re-read the connected wallet on-chain and unlock what it now covers */
  async refreshHolding() {
    await this.ctx.state.ensureLoaded();

    const { status } = await this.ctx.wallet.syncConnectedWallet();

    if (status) {
      await this.ctx.mining.unlockAffordableLevel();
    }
  }

  /** Report a holding of your own, prompting for it, since the drop takes the figure as given */
  async reportBalanceInteractive() {
    await this.ctx.state.ensureLoaded();

    const address = this.ctx.wallet.getConnectedWalletAddress();

    if (!address) {
      this.logger.warn(
        "No wallet connected. Use the Connect Wallet tool to bind one.",
      );
      return;
    }

    const holding = await promptAmount(this.core, {
      question: "How much MRG should the drop credit?",
      token: "MRG",
      emptyMessage: "No balance provided.",
    });

    if (!holding) return;

    const { status } = await this.ctx.wallet.reportWallet(address, holding);

    if (!status) return;

    const { mining } = this.ctx;
    const reachableLevel = mining.findLevelForHolding(mining.getLevelHolding());

    this.logger.keyValue("Reachable Level", reachableLevel);
    this.logger.keyValue(
      "Speed",
      `${mining.getSpeedForLevel(reachableLevel)} TH/s`,
    );
  }

  /** Log the account's Genesis NFTs and what they are worth at withdrawal */
  async logNftHoldings() {
    await this.ctx.state.ensureLoaded();

    const { nft } = this.ctx;
    const address = this.ctx.wallet.getConnectedWalletAddress();

    if (!address) {
      this.logger.warn(
        "No wallet connected. Use the Connect Wallet tool to bind one.",
      );
      return;
    }

    /** Read afresh, since the tool is how a new NFT is checked for */
    nft.reset();

    const holdings = await nft.readNftHoldings(address);
    const discountPercent = nft.getNftDiscountPercent(holdings);

    this.logger.newline();
    this.logger.keyValue("Wallet", address);
    this.logger.keyValue("Genesis NFTs", nft.countNftHoldings(holdings), {
      valueStyle: holdings.length
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });

    for (const holding of holdings) {
      this.logger.keyValue(holding.name, holding.quantity);
    }

    this.logger.newline();
    this.logger.keyValue("Fee Discount", `${discountPercent}%`);
    this.logger.keyValue(
      "Withdrawal Fee",
      formatAmount(nft.getWithdrawalFee(discountPercent)),
    );
    this.logger.keyValue(
      "Drop sees an NFT holder",
      this.ctx.state.user()["isNftHolder"] ? "Yes" : "No",
    );

    return { holdings, discountPercent };
  }

  /** Fetch a withdrawal slider and log it, so the puzzle can be studied */
  async inspectCaptcha() {
    await this.ctx.state.ensureLoaded();

    const challenge = await this.ctx.api.createCaptcha();

    if (!challenge?.["success"]) {
      this.logger.error(
        "Failed to get a captcha:",
        challenge?.["error"] || "Unknown error",
      );
      return;
    }

    const describe = (image) => {
      const match = String(image || "").match(/^data:([^;,]+);base64,/);

      return match
        ? `${match[1]}, ${image.length - match[0].length} base64 chars`
        : `${String(image || "").length} chars`;
    };

    this.logger.newline();
    this.logger.keyValue("Captcha ID", challenge["captchaId"]);
    this.logger.keyValue("Piece Top", challenge["pieceTop"]);
    this.logger.keyValue("Piece Offset X", challenge["pieceOffsetX"]);
    this.logger.keyValue("Background", describe(challenge["bgImage"]));
    this.logger.keyValue("Piece", describe(challenge["pieceImage"]));
    this.logger.keyValue("Slider X", findSliderX(challenge));
    this.logger.keyValue(
      "Other Fields",
      Object.keys(challenge)
        .filter(
          (key) =>
            ![
              "success",
              "captchaId",
              "pieceTop",
              "pieceOffsetX",
              "bgImage",
              "pieceImage",
            ].includes(key),
        )
        .join(", ") || "None",
    );

    this.logger.newline();
    this.logger.info("Background:", challenge["bgImage"]);
    this.logger.info("Piece:", challenge["pieceImage"]);

    return challenge;
  }

  /** Pay the on-chain verification, prompting for the bound wallet's phrase */
  async verifyWalletInteractive() {
    const phrase = ((await this.core.prompt("Enter the wallet phrase:")) || "")
      .trim()
      .split(/\s+/)
      .join(" ");

    if (!phrase) {
      this.logger.warn("No phrase provided.");
      return;
    }

    const version = await promptWalletVersion(this.core);

    if (!version) {
      this.logger.warn("No wallet version selected.");
      return;
    }

    const { status, message } = await this.ctx.auto.verifyWallet({
      phrase,
      version,
    });

    if (status) {
      this.logger.success(message);
    } else {
      this.logger.error("Verification failed:", message);
    }
  }

  /** Show what the verification needs and ask the drop whether it has landed */
  async checkVerificationInteractive() {
    await this.ctx.state.ensureLoaded();

    const info = await this.ctx.api.fetchVerificationInfo();
    const payment = info?.["payment"] || {};

    this.logger.newline();
    this.logger.keyValue("Verified", info?.["verified"] ? "Yes" : "No");
    this.logger.keyValue("Via", info?.["via"] || "-");
    this.logger.keyValue(
      "Re-verify Required",
      info?.["verificationRequired"] ? "Yes" : "No",
    );
    this.logger.keyValue("Amount", `${payment["amountGram"] ?? "?"} TON`);
    this.logger.keyValue("To", payment["address"] || "-");
    this.logger.keyValue(
      "Exempt Holding",
      `${info?.["exemptWalletMrg"] ?? 5000} MRG`,
    );

    if (info?.["verified"]) return info;

    const check = await this.ctx.api.checkVerification();

    this.logger.keyValue("Payment", check?.["status"] || check?.["error"]);

    if (check?.["status"] === "verified") {
      await this.ctx.state.load();
    }

    return info;
  }

  /** Check in on demand */
  async checkInInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.mining.checkInDaily();
  }

  /** Claim mining on demand */
  async claimMiningInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.mining.claimPendingMining();
  }

  /** Unlock a level, prompting for which one and leaving the holding to the drop to judge */
  async unlockLevelInteractive() {
    await this.ctx.state.ensureLoaded();

    const { mining } = this.ctx;
    const input = await this.core.prompt("Which level?");
    const level = Number((input || "").trim());

    if (!Number.isInteger(level) || level < 1 || level > MAXIMUM_MINER_LEVEL) {
      this.logger.warn(`Enter a level between 1 and ${MAXIMUM_MINER_LEVEL}.`);
      return;
    }

    const required = mining.getRequiredHoldingForLevel(level);
    const holding = mining.getLevelHolding();

    this.logger.newline();
    this.logger.keyValue("Level", level);
    this.logger.keyValue("Required Holding", formatAmount(required));
    this.logger.keyValue("Your Holding", formatAmount(holding));

    /** Reported rather than refused, so a level can be tried whatever the holding reads */
    if (holding.lessThan(required)) {
      this.logger.warn(
        `${formatAmount(required.minus(holding))} MRG short of level ${level}, asking anyway.`,
      );
    }

    await mining.unlockToLevel(level);
  }

  /** Report what a holding would mine, prompting for the amount */
  async estimateMining() {
    const holding = await promptAmount(this.core, {
      question: "How much MRG?",
      token: "MRG",
    });

    if (!holding) return;

    const { mining } = this.ctx;
    const level = mining.findLevelForHolding(holding);
    const speed = mining.getSpeedForLevel(level);
    const dailyOutput = new Decimal(mining.getDailyOutputForLevel(level));

    this.logger.newline();
    this.logger.keyValue("MRG Amount", formatAmount(holding));
    this.logger.keyValue("Reachable Level", level);
    this.logger.keyValue(
      "Level Cost",
      formatAmount(mining.getRequiredHoldingForLevel(level)),
    );
    this.logger.keyValue("Speed", `${speed} TH/s`);

    this.logger.newline();
    logMiningRateBreakdown(this.logger, dailyOutput);
  }
}
