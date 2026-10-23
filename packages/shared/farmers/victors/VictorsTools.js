import { keyPairFromPhraseOrSecretKey } from "../../lib/ton/wallet.js";
import { MAXIMUM_MINER_LEVEL } from "../../lib/auto/minerCurve.js";
import Decimal from "decimal.js";

/** Trait: the interactive tools the farmer offers */
export default class VictorsTools {
  /** Reset a banned account after confirming, which wipes its progress */
  async resetAccountInteractive() {
    if (!this.banInfo) {
      try {
        await this.login();
      } catch {}
    }

    if (!this.banInfo) {
      this.logger.info("The account is not banned.");
      return;
    }

    if (!this.banInfo.canReset) {
      this.logger.error("The ban does not allow a reset.");
      return;
    }

    const confirm = await this.promptInput({
      type: "select",
      text: "Resetting wipes the account's balance and progress. Continue?",
      options: [
        { value: "no", label: "Cancel" },
        { value: "yes", label: "Reset" },
      ],
    });

    if (confirm !== "yes") return;

    const result = await this.resetAccount(this.banInfo.termsVersion);

    if (result?.["success"] === false) {
      this.logger.error("Failed to reset the account:", result["error"]);
      return;
    }

    if (result?.["humanPass"]) {
      await this.storeHumanPass(result["humanPass"]);
    }

    this.banInfo = null;
    this.applyResult(result);
    this.logger.success("Account reset.");
  }

  /** Play Deep Mine on demand */
  async playArcadeInteractive() {
    await this.ensureStateLoaded();
    await this.playArcade();
  }

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
            icon: "search",
            title: "Refresh Holding",
            action: this.refreshHoldingInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "verify-wallet",
            icon: "kyc",
            title: "Verify Wallet",
            action: this.verifyWalletInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "check-verification",
            icon: "kyc",
            title: "Check Verification",
            action: this.checkVerificationInteractive.bind(this),
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
            id: "estimate-mining",
            icon: "search",
            title: "Estimate Mining",
            action: this.estimateMining.bind(this),
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
            action: this.unlockLevelInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Arcade",
        list: [
          {
            id: "deep-mine",
            icon: "check",
            title: "Deep Mine",
            action: this.playArcadeInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "NFT",
        list: [
          {
            id: "nft-status",
            icon: "search",
            title: "NFT Status",
            action: this.nftStatusInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "mint-nft",
            icon: "withdraw",
            title: "Mint NFT",
            action: this.mintNftInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Squad",
        list: [
          {
            id: "squad",
            icon: "user",
            title: "Squad",
            action: this.squadInteractive.bind(this),
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
            action: this.obtainHumanPass.bind(this),
            dispatch: false,
          },
          {
            id: "reset-account",
            icon: "reconnect",
            title: "Reset Banned Account",
            action: this.resetAccountInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "reset-human-pass",
            icon: "reconnect",
            title: "Reset Human Pass",
            action: this.resetHumanPass.bind(this),
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
        ],
      },
    ];
  }

  /** Bind a wallet, proven from its phrase or secret key, or unproven from a bare address */
  async connectWalletInteractive() {
    const input = await this.promptInput(
      "Enter your TON Wallet Phrase / Secret Key (hex), or an address:",
    );
    const value = (input || "").trim();

    if (!value) {
      this.logger.warn("Nothing provided.");
      return;
    }

    await this.ensureStateLoaded();

    if (!this.utils.isTonAddress(value)) {
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

      const keyPair = await keyPairFromPhraseOrSecretKey(value);
      const { status } = await this.connectSignedWallet(keyPair, version);

      if (status) {
        await this.refreshHolding();
      }
      return;
    }

    const address = value;
    this.logger.warn(
      "Bound by address only, its VIC will not count until proven.",
    );

    const { status } = await this.connectWalletAddress(address);

    if (!status) return;

    this.logger.keyValue(
      "On-chain VIC",
      this.formatAmount(await this.readOnChainHolding(address)),
    );
  }

  /** Unbind the wallet the account is on */
  async disconnectWalletInteractive() {
    await this.ensureStateLoaded();

    const result = await this.disconnectWallet();

    if (result?.["success"] === false) {
      this.logger.error("Failed to disconnect:", result["error"]);
      return;
    }

    this.applyResult(result);
    await this.rememberWalletVersion(undefined);
    this.logger.success("Wallet disconnected.");
  }

  /** Re-read the holding on demand */
  async refreshHoldingInteractive() {
    await this.ensureStateLoaded();
    await this.refreshHolding();
  }

  /** Pay the verification from a wallet phrase, connecting that wallet first when the account has none */
  async verifyWalletInteractive() {
    const phrase = ((await this.promptInput("Enter the wallet phrase:")) || "")
      .trim()
      .split(/\s+/)
      .join(" ");

    if (!phrase) {
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

    const { status, message } = await this.verifyAutoWallet({
      phrase,
      version,
    });

    if (status) {
      this.logger.success(message);
    } else {
      this.logger.error("Verification failed:", message);
    }
  }

  /** A derived wallet's phrase is known, so its verification is paid right after it is bound */
  async afterDerivedWalletConnected({ phrase, version }) {
    const { status, message } = await this.verifyWalletIfNeeded({
      phrase,
      version,
    });

    if (!status) {
      this.logger.warn("Wallet not verified:", message || "not confirmed yet");
    }
  }

  /** Show what the verification needs and ask the drop whether it has landed */
  async checkVerificationInteractive() {
    await this.ensureStateLoaded();

    const verify = this.getVerify();

    this.logger.newline();
    this.logger.keyValue("Verified", verify["verified"] ? "Yes" : "No");
    this.logger.keyValue("Pending", verify["pending"] ? "Yes" : "No");
    this.logger.keyValue("Treasury", verify["treasury"]);
    this.logger.keyValue("Amount", `${verify["amountTon"]} TON`);
    this.logger.keyValue("Comment", verify["comment"]);
    this.logger.keyValue(
      "Wallet Age",
      `${verify["walletAgeDays"] ?? "?"} / ${verify["minWalletAgeDays"]} days`,
    );

    if (verify["verified"]) {
      this.logger.success("Wallet is already verified.");
      return;
    }

    if (!this.getConnectedWalletAddress()) {
      this.logger.warn("Connect a wallet first.");
      return;
    }

    await this.pollVerification(1);
  }

  /** List the crew and claim what it has earned */
  async squadInteractive() {
    await this.ensureStateLoaded();

    const referral = this.state_data.referral || {};
    const friends = await this.fetchFriends();

    this.logger.newline();
    this.logger.keyValue("Referrals", referral["referralsCount"] || 0);
    this.logger.keyValue("With Wallet", referral["walletReferralsCount"] || 0);
    this.logger.keyValue("Qualified", referral["eligibleCount"] || 0);
    this.logger.keyValue(
      "Unclaimed Bonus",
      this.formatAmount(referral["unclaimedBonus"] || 0),
    );
    this.logger.keyValue(
      "Unclaimed Commission",
      this.formatAmount(referral["unclaimedCommission"] || 0),
    );

    for (const friend of friends) {
      this.logger.newline();
      this.logger.keyValue(
        "Friend",
        `${friend["name"]}${friend["username"] ? ` (@${friend["username"]})` : ""}`,
      );
      this.logger.keyValue("Level", friend["level"]);
      this.logger.keyValue("Wallet", friend["walletConnected"] ? "Yes" : "No");
      this.logger.keyValue("Qualified", friend["qualified"] ? "Yes" : "No", {
        valueStyle: friend["qualified"]
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      });

      if (friend["nextStep"]) {
        this.logger.keyValue("Next Step", friend["nextStep"]);
      }
    }

    this.logger.newline();
    await this.claimSquadRewards();
  }

  /** Claim mining on demand */
  async claimMiningInteractive() {
    await this.ensureStateLoaded();
    await this.claimPendingMining();
  }

  /** Hire a level, prompting for which one and leaving the holding to the drop to judge */
  async unlockLevelInteractive() {
    await this.ensureStateLoaded();

    const input = await this.promptInput("Which level?");
    const level = Number((input || "").trim());

    if (!Number.isInteger(level) || level < 1 || level > MAXIMUM_MINER_LEVEL) {
      this.logger.warn("Enter a valid level.");
      return;
    }

    const required = this.getRequiredHoldingForLevel(level);
    const holding = Number(this.state_data["holding"]) || 0;

    this.logger.newline();
    this.logger.keyValue("Level", level);
    this.logger.keyValue("Required Holding", this.formatAmount(required));
    this.logger.keyValue("Your Holding", this.formatAmount(holding));

    /** Reported rather than refused, so a level can be tried whatever the holding reads */
    if (holding < required) {
      this.logger.warn(
        `${this.formatAmount(required - holding)} VIC short of level ${level}, asking anyway.`,
      );
    }

    await this.unlockToLevel(level);
  }

  /** Report what a holding would mine, prompting for it */
  async estimateMining() {
    const input = await this.promptInput("How much VIC?");
    const trimmed = (input || "").trim();

    if (!trimmed) return;

    let holding;

    try {
      holding = new Decimal(trimmed);
    } catch {
      this.logger.error("Invalid VIC amount:", trimmed);
      return;
    }

    if (holding.isNegative()) {
      this.logger.error("VIC amount must be non-negative");
      return;
    }

    const level = this.findLevelForHolding(holding.toNumber());

    this.logger.newline();
    this.logger.keyValue("VIC Holding", this.formatAmount(holding));
    this.logger.keyValue("Reachable Level", level);
    this.logger.keyValue(
      "Level Requirement",
      this.formatAmount(this.getRequiredHoldingForLevel(level)),
    );
    this.logger.keyValue("Speed", `${this.getSpeedForLevel(level)} TH/s`);

    this.logger.newline();
    this.logMiningRateBreakdown(
      new Decimal(this.getDailyOutputForLevel(level)),
    );
  }
}
