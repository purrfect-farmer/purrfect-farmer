import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import { createWallet } from "../../lib/ton/wallet.js";
import { ERROR_CODE, LOOT_TOKEN } from "./constants.js";

/** Binding the wallet and reading its holding */
export default class LootVaultWallet extends FarmerModule {
  /** The address the drop currently has the account on */
  getConnectedWalletAddress() {
    const wallets = this.ctx.state.balances?.["wallets"] || [];

    return wallets.find((wallet) => wallet["active"])?.["addr"] || null;
  }

  /** Register on the address, or bind it to the registered account, sent as `UQ...` the way the page sends it */
  async connectWalletAddress(address) {
    const friendly = this.utils.toFriendlyAddress(address);

    await this.ctx.state.ensureLoaded();

    if (!this.ctx.state.isRegistered()) {
      return this.ctx.session.register(friendly);
    }

    const connected = this.getConnectedWalletAddress();

    if (connected && this.utils.isSameTonAddress(connected, friendly)) {
      return { status: true, message: "Wallet already connected" };
    }

    try {
      await this.ctx.api.connectWallet(friendly);
    } catch (error) {
      const message =
        error.code === ERROR_CODE.WALLET_TAKEN
          ? "The wallet is bound to another account"
          : error.message;

      this.logger.error(message);
      return { status: false, message };
    }

    await this.ctx.state.loadBalances();
    this.logger.success(`Wallet connected: ${friendly}`);

    return { status: true, message: "Wallet connected" };
  }

  /** The drop takes a bare address, so a key pair is bound by the address it controls */
  connectSignedWallet(keyPair, version) {
    const wallet = createWallet(keyPair.publicKey, Number(version));

    return this.connectWalletAddress(
      wallet.address.toString({ bounceable: false }),
    );
  }

  /** Unbind the account's wallet */
  async disconnectWallet() {
    await this.ctx.api.disconnectWallet();
    await this.ctx.state.loadBalances();
  }

  /** Re-read the on-chain holding the drop counts */
  async refreshHolding() {
    await this.ctx.state.loadBalances();

    this.logger.keyValue(
      `On-chain ${LOOT_TOKEN}`,
      formatAmount(this.ctx.state.holding()),
    );
  }
}
