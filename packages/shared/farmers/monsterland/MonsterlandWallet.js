import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** Binding the payout wallet */
export default class MonsterlandWallet extends FarmerModule {
  /** The bound address in its friendly, non-bounceable form */
  getConnectedWalletAddress() {
    const address = this.ctx.state.profile()["payments"]?.["wallet"];

    return address ? this.utils.toFriendlyAddress(address) : null;
  }

  /** Bind an address, sent friendly and non-bounceable the way TON Connect's `useTonAddress` hands it to the page */
  async connectWalletAddress(address) {
    if (!this.utils.toRawAddress(address)) {
      this.logger.error("Not a valid TON address:", address);
      return { status: false, message: "Not a valid TON address" };
    }

    const wallet = this.utils.toFriendlyAddress(address);
    const result = await this.ctx.api.patchUser({ wallet });

    if (!result.ok || result.data["success"] === false) {
      const message = result.data["error"] || "Failed to connect the wallet";

      this.logger.error(message);
      return { status: false, message };
    }

    const profile = this.ctx.state.profile();

    profile["payments"] = result.data["payments"] || {
      ...profile["payments"],
      wallet,
    };

    this.logger.success(`Wallet connected: ${wallet}`);

    return { status: true, message: "Wallet connected" };
  }

  /** Unbind the wallet, which the page does by saving an empty one */
  disconnectWallet() {
    return this.ctx.api.patchUser({ wallet: "" });
  }

  /** Bind a wallet, prompting for its address */
  async connectWalletInteractive() {
    const input = await this.core.prompt("Enter your TON wallet address:");
    const address = (input || "").trim();

    if (!address) {
      this.logger.warn("No address provided.");
      return;
    }

    if (!this.utils.isTonAddress(address)) {
      this.logger.warn("Not a valid TON address.");
      return;
    }

    await this.ctx.state.ensureLoaded();
    await this.connectWalletAddress(address);
  }

  /** Unbind the wallet the account is on */
  async disconnectWalletInteractive() {
    await this.ctx.state.ensureLoaded();

    const result = await this.disconnectWallet();

    if (!result.ok || result.data["success"] === false) {
      this.logger.error("Failed to disconnect:", result.data["error"]);
      return;
    }

    const profile = this.ctx.state.profile();

    profile["payments"] = { ...profile["payments"], wallet: "" };

    await this.ctx.walletVersion.remember(undefined);
    this.logger.success("Wallet disconnected.");
  }
}
