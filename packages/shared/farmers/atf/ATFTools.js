import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import createAutoWalletTools from "../../lib/farmer/autoWalletTools.js";

/** The interactive tools the farmer offers */
export default class ATFTools extends FarmerModule {
  /** Create Tools */
  create() {
    return [
      {
        name: "Wallet",
        list: [
          ...createAutoWalletTools({
            connect: () => this.ctx.wallet.connectWalletInteractive(),
            disconnect: () => this.ctx.wallet.disconnectWalletInteractive(),
            prompts: this.ctx.connectPrompts,
          }),
          {
            id: "reconnect-wallet",
            icon: "connect",
            title: "Reconnect Wallet",
            action: () => this.ctx.wallet.reconnectWallet(),
            dispatch: false,
          },
        ],
      },
      {
        name: "Withdrawal",
        list: [
          {
            id: "withdraw",
            icon: "withdraw",
            title: "Withdraw",
            action: () => this.ctx.flow.withdrawInteractive(),
            dispatch: false,
          },
          {
            id: "pending-withdrawals",
            icon: "history",
            title: "Pending Withdrawals",
            action: () => this.ctx.withdrawal.logPendingWithdrawals(),
          },
        ],
      },
      {
        name: "Mining",
        list: [
          {
            id: "estimate-daily-mining",
            icon: "search",
            title: "Estimate Daily Mining",
            action: () => this.ctx.mining.estimateDailyMining(),
            dispatch: false,
          },
        ],
      },
      {
        name: "Verification",
        list: [
          {
            id: "register-toobit",
            icon: "register",
            title: "Register to Toobit",
            action: () => this.registerToToobit(),
            dispatch: false,
          },
          {
            id: "connect-toobit-user",
            icon: "user",
            title: "Connect Toobit User",
            action: () => this.connectToobitUser(),
            dispatch: false,
          },
          {
            id: "toobit-status",
            icon: "check",
            title: "Toobit Status",
            action: () => this.logToobitStatus(),
            dispatch: false,
          },
          {
            id: "disconnect-toobit",
            icon: "disconnect",
            title: "Disconnect Toobit",
            action: () => this.disconnectToobitInteractive(),
            dispatch: false,
          },
          {
            id: "check-toobit-kyc",
            icon: "kyc",
            title: "Check Toobit KYC",
            action: () => this.checkToobitKycInteractive(),
            dispatch: false,
          },
        ],
      },
    ];
  }

  async registerToToobit() {
    window.open(
      "https://www.toobit.com/en-US/register?invite_code=atffamily&activityId=1361",
      "_blank",
    );
  }

  async logToobitStatus() {
    try {
      const data = await this.ctx.api.getToobitStatus();

      if (data.status !== "success") {
        this.logger.error(data.message);
        return;
      }

      const connected = Number(data.connected) === 1;

      this.logger.keyValue("Connected", connected ? "Yes" : "No", {
        valueStyle: connected
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      });
      this.logger.keyValue("UID", data.uid || "-", { format: false });
    } catch (error) {
      this.logger.error(error?.response?.data?.message || error.message);
    }
  }

  async disconnectToobitInteractive() {
    try {
      const data = await this.ctx.api.disconnectToobitUid();

      if (data.status !== "success") {
        this.logger.error(data.message);
        return;
      }

      Object.assign(this.ctx.state.data.user, {
        toobit_connected: Number(data.connected) || 0,
        toobit_uid: data.uid || "",
      });
      this.logger.success(data.message || "Toobit disconnected!");
    } catch (error) {
      this.logger.error(error?.response?.data?.message || error.message);
    }
  }

  async connectToobitUser() {
    const input = await this.core.prompt("Enter Toobit UID:");
    const uid = (input || "").trim();

    if (!uid) return;

    try {
      const { status, message } = await this.ctx.api.connectToobitUid(uid);
      if (status !== "success") {
        this.logger.error(message);
        return;
      }
      this.logger.success("Toobit connected!");
    } catch (error) {
      const message = error?.response?.data?.message || error.message;
      this.logger.error(message);
      return;
    }
  }

  async checkToobitKycInteractive() {
    const data = await this.ctx.api.checkToobitKyc();
    const { status, message } = data;

    if (status !== "success") {
      this.logger.error(message);
      return;
    } else {
      this.logger.keyValue("Connected", data.connected);
      this.logger.keyValue("UID", data.uid, { format: false });
      this.logger.keyValue("KYC Verified", data.kyc_verified);
      this.logger.keyValue("Whitelisted", data.whitelisted);
      this.logger.keyValue("Restored Withdrawals", data.restored_withdrawals);
      this.logger.keyValue("Reserved Withdrawals", data.reserved_withdrawals);
      this.logger.keyValue("Message", data.message);
    }
    this.logger.success("Toobit KYC checked!");
  }

  /** Explain the TH/s figure the ATF app advertises */
  logHashPowerExplainer(hashPower, divisor) {
    const base = hashPower.times(50);

    this.logger.newline();
    this.logger.info("What is TH/s?");
    this.logger.debug(
      "TH/s (terahashes per second) is only how the app labels a miner's speed;",
    );
    this.logger.debug(
      "nothing is actually hashed. It is the level's base rate divided by 50:",
    );
    this.logger.debug(
      `  ${hashPower.toDecimalPlaces(2).toString()} TH/s x 50 = ${base.toString()} ATF/day at difficulty 1.`,
    );
    this.logger.debug(
      `  Network difficulty then divides that: ${base.toString()} / ${divisor.toDecimalPlaces(4).toString()} = ${formatAmount(base.div(divisor))} ATF/day.`,
    );
    this.logger.debug(
      "So a higher TH/s always means a faster miner, but the ATF it actually pays",
    );
    this.logger.debug(
      "drops as difficulty rises. The rates above already include difficulty.",
    );
  }
}
