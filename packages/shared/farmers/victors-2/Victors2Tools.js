import { MAXIMUM_MINER_LEVEL } from "../../lib/auto/minerCurve.js";
import FarmerModule from "../../lib/farmer/FarmerModule.js";
import {
  formatAmount,
  logMiningRateBreakdown,
} from "../../lib/farmer/format.js";
import { readOnChainHolding } from "../../lib/farmer/onChain.js";
import { keyPairFromPhraseOrSecretKey } from "../../lib/ton/wallet.js";
import { TOKEN_SYMBOL } from "./constants.js";
import Decimal from "decimal.js";
import createAutoWalletTools from "../../lib/farmer/autoWalletTools.js";
import { promptAmount, promptWalletVersion } from "../../lib/farmer/prompts.js";

/** The interactive tools the farmer offers */
export default class Victors2Tools extends FarmerModule {
  /** Reset a banned account after confirming, which wipes its progress */
  async resetAccountInteractive() {
    if (!this.ctx.session.banInfo) {
      try {
        await this.ctx.session.loginWithoutReset();
      } catch {}
    }

    if (!this.ctx.session.banInfo) {
      this.logger.info("The account is not banned.");
      return;
    }

    if (!this.ctx.session.banInfo.canReset) {
      this.logger.error("The ban does not allow a reset.");
      return;
    }

    const confirm = await this.core.prompt({
      type: "select",
      text: "Resetting wipes the account's balance and progress. Continue?",
      options: [
        { value: "no", label: "Cancel" },
        { value: "yes", label: "Reset" },
      ],
    });

    if (confirm !== "yes") return;

    await this.ctx.session.resetAccount();
  }

  /** Play Deep Mine on demand */
  async playArcadeInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.arcade.playArcade();
  }

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
            icon: "search",
            title: "Refresh Holding",
            action: () => this.refreshHoldingInteractive(),
            dispatch: false,
          },
          {
            id: "mint-pass",
            icon: "kyc",
            title: "Mint Mine Pass",
            action: () => this.ctx.pass.mintInteractive(),
            dispatch: false,
          },
          {
            id: "check-pass",
            icon: "kyc",
            title: "Check Mine Pass",
            action: () => this.ctx.pass.checkInteractive(),
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
        name: "Arcade",
        list: [
          {
            id: "deep-mine",
            icon: "check",
            title: "Deep Mine",
            action: () => this.playArcadeInteractive(),
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
            action: () => this.ctx.nft.nftStatusInteractive(),
            dispatch: false,
          },
          {
            id: "mint-nft",
            icon: "withdraw",
            title: "Mint NFT",
            action: () => this.ctx.nft.mintNftInteractive(),
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
            action: () => this.squadInteractive(),
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
            action: () => this.ctx.humanPass.obtain(),
            dispatch: false,
          },
          {
            id: "reset-account",
            icon: "reconnect",
            title: "Reset Banned Account",
            action: () => this.resetAccountInteractive(),
            dispatch: false,
          },
          {
            id: "reset-human-pass",
            icon: "reconnect",
            title: "Reset Human Pass",
            action: () => this.ctx.humanPass.reset(),
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
        ],
      },
    ];
  }

  /** Bind a wallet, proven from its phrase or secret key, or unproven from a bare address */
  async connectWalletInteractive() {
    const input = await this.core.prompt(
      "Enter your TON Wallet Phrase / Secret Key (hex), or an address:",
    );
    const value = (input || "").trim();

    if (!value) {
      this.logger.warn("Nothing provided.");
      return;
    }

    await this.ctx.state.ensureLoaded();

    if (!this.utils.isTonAddress(value)) {
      const version = await promptWalletVersion(this.core);

      if (!version) {
        this.logger.warn("No wallet version selected.");
        return;
      }

      const keyPair = await keyPairFromPhraseOrSecretKey(value);
      const { status } = await this.ctx.wallet.connectSignedWallet(
        keyPair,
        version,
      );

      if (status) {
        await this.ctx.walletVersion.remember(version);
        await this.ctx.wallet.refreshHolding();
      }
      return;
    }

    const address = value;
    this.logger.warn(
      `Bound by address only, its ${TOKEN_SYMBOL} will not count until proven.`,
    );

    const { status } = await this.ctx.wallet.connectWalletAddress(address);

    if (!status) return;

    this.logger.keyValue(
      `On-chain ${TOKEN_SYMBOL}`,
      formatAmount(await readOnChainHolding(this.core, address)),
    );
  }

  /** Unbind the wallet the account is on */
  async disconnectWalletInteractive() {
    await this.ctx.state.ensureLoaded();

    const result = await this.ctx.api.disconnectWallet();

    if (result?.["success"] === false) {
      this.logger.error("Failed to disconnect:", result["error"]);
      return;
    }

    this.ctx.state.apply(result);
    await this.ctx.walletVersion.remember(undefined);
    this.logger.success("Wallet disconnected.");
  }

  /** Re-read the holding on demand */
  async refreshHoldingInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.wallet.refreshHolding();
  }

  /** A derived wallet's phrase is known, so its Mine Pass is paid for right after it is bound */
  async afterDerivedWalletConnected({ phrase, version }) {
    const { status, message } = await this.ctx.pass.pay({ phrase, version });

    if (!status) {
      this.logger.warn("Mine Pass not active:", message);
    }
  }

  /** List the crew and claim what it has earned */
  async squadInteractive() {
    await this.ctx.state.ensureLoaded();

    const referral = this.ctx.state.data.referral || {};
    const friends = await this.ctx.api.fetchFriends();

    this.logger.newline();
    this.logger.keyValue("Referrals", referral["referralsCount"] || 0);
    this.logger.keyValue("With Wallet", referral["walletReferralsCount"] || 0);
    this.logger.keyValue("Qualified", referral["eligibleCount"] || 0);
    this.logger.keyValue(
      "Unclaimed Bonus",
      formatAmount(referral["unclaimedBonus"] || 0),
    );
    this.logger.keyValue(
      "Unclaimed Commission",
      formatAmount(referral["unclaimedCommission"] || 0),
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
    await this.ctx.tasks.claimSquadRewards();
  }

  /** Claim mining on demand */
  async claimMiningInteractive() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.mining.claimPendingMining();
  }

  /** Hire a level, prompting for which one and leaving the holding to the drop to judge */
  async unlockLevelInteractive() {
    await this.ctx.state.ensureLoaded();

    const input = await this.core.prompt("Which level?");
    const level = Number((input || "").trim());

    if (!Number.isInteger(level) || level < 1 || level > MAXIMUM_MINER_LEVEL) {
      this.logger.warn("Enter a valid level.");
      return;
    }

    const required = this.ctx.mining.getRequiredHoldingForLevel(level);
    const holding = Number(this.ctx.state.data["holding"]) || 0;

    this.logger.newline();
    this.logger.keyValue("Level", level);
    this.logger.keyValue("Required Holding", formatAmount(required));
    this.logger.keyValue("Your Holding", formatAmount(holding));

    /** Reported rather than refused, so a level can be tried whatever the holding reads */
    if (holding < required) {
      this.logger.warn(
        `${formatAmount(required - holding)} ${TOKEN_SYMBOL} short of level ${level}, asking anyway.`,
      );
    }

    await this.ctx.mining.unlockToLevel(level);
  }

  /** Report what a holding would mine, prompting for it */
  async estimateMining() {
    const holding = await promptAmount(this.core, {
      question: `How much ${TOKEN_SYMBOL}?`,
      token: TOKEN_SYMBOL,
    });

    if (!holding) return;

    const level = this.ctx.mining.findLevelForHolding(holding.toNumber());

    this.logger.newline();
    this.logger.keyValue(`${TOKEN_SYMBOL} Holding`, formatAmount(holding));
    this.logger.keyValue("Reachable Level", level);
    this.logger.keyValue(
      "Level Requirement",
      formatAmount(this.ctx.mining.getRequiredHoldingForLevel(level)),
    );
    this.logger.keyValue(
      "Speed",
      `${this.ctx.mining.getSpeedForLevel(level)} TH/s`,
    );

    this.logger.newline();
    logMiningRateBreakdown(
      this.logger,
      new Decimal(this.ctx.mining.getDailyOutputForLevel(level)),
    );
  }
}
