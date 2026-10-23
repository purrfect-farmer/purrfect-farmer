import ATFAccount from "./ATFAccount.js";

/** The interactive tools the farmer offers */
export default class ATFTools extends ATFAccount {
  /** Create Tools */
  createTools() {
    return [
      {
        name: "Wallet",
        list: [
          ...this.createAutoWalletTools(),
          {
            id: "reconnect-wallet",
            icon: "connect",
            title: "Reconnect Wallet",
            action: this.reconnectWallet.bind(this),
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
            action: this.withdraw.bind(this),
            dispatch: false,
          },
          {
            id: "pending-withdrawals",
            icon: "history",
            title: "Pending Withdrawals",
            action: this.logPendingWithdrawals.bind(this),
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
            action: this.estimateDailyMining.bind(this),
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
            action: this.registerToToobit.bind(this),
            dispatch: false,
          },
          {
            id: "connect-toobit-user",
            icon: "user",
            title: "Connect Toobit User",
            action: this.connectToobitUser.bind(this),
            dispatch: false,
          },
          {
            id: "toobit-status",
            icon: "check",
            title: "Toobit Status",
            action: this.logToobitStatus.bind(this),
            dispatch: false,
          },
          {
            id: "disconnect-toobit",
            icon: "disconnect",
            title: "Disconnect Toobit",
            action: this.disconnectToobitInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "check-toobit-kyc",
            icon: "kyc",
            title: "Check Toobit KYC",
            action: this.checkToobitKycInteractive.bind(this),
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
      const data = await this.getToobitStatus();

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
      const data = await this.disconnectToobitUid();

      if (data.status !== "success") {
        this.logger.error(data.message);
        return;
      }

      Object.assign(this.user_data.user, {
        toobit_connected: Number(data.connected) || 0,
        toobit_uid: data.uid || "",
      });
      this.logger.success(data.message || "Toobit disconnected!");
    } catch (error) {
      this.logger.error(error?.response?.data?.message || error.message);
    }
  }

  async connectToobitUser() {
    const input = await this.promptInput("Enter Toobit UID:");
    const uid = (input || "").trim();

    if (!uid) return;

    try {
      const { status, message } = await this.connectToobitUid(uid);
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
    const data = await this.checkToobitKyc();
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
      `  Network difficulty then divides that: ${base.toString()} / ${divisor.toDecimalPlaces(4).toString()} = ${this.formatAmount(base.div(divisor))} ATF/day.`,
    );
    this.logger.debug(
      "So a higher TH/s always means a faster miner, but the ATF it actually pays",
    );
    this.logger.debug(
      "drops as difficulty rises. The rates above already include difficulty.",
    );
  }
}
