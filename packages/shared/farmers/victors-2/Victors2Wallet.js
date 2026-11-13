import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import { buildTonProof } from "../../lib/ton/proof.js";
import { createWallet } from "../../lib/ton/wallet.js";
import { TOKEN_SYMBOL, TON_PROOF_DOMAIN } from "./constants.js";

/** Binding the wallet and reading its holding */
export default class Victors2Wallet extends FarmerModule {
  /** The address the drop currently has the account on */
  getConnectedWalletAddress() {
    return this.ctx.state.data?.user?.["walletAddress"] || null;
  }

  /** Bind an address to the account, sent as `UQ...` the way the page sends it */
  async connectWalletAddress(address) {
    const friendly = this.utils.toFriendlyAddress(address);
    const result = await this.ctx.api.connectWallet(friendly);

    if (result?.["success"] === false) {
      const message = result["error"] || "Failed to connect the wallet";

      this.logger.error(message);
      return { status: false, message };
    }

    this.ctx.state.apply(result);
    this.logger.success(`Wallet connected: ${friendly}`);

    return { status: true, message: "Wallet connected" };
  }

  /** Bind the wallet a key pair controls, signing the TON proof that makes its holding count */
  async connectSignedWallet(keyPair, version) {
    const wallet = createWallet(keyPair.publicKey, Number(version));
    const address = wallet.address.toString({ bounceable: false });
    const tonProof = await buildTonProof({
      wallet,
      secretKey: keyPair.secretKey,
      domain: TON_PROOF_DOMAIN,
      payload: await this.ctx.api.fetchProofPayload(),
    });

    const result = await this.ctx.api.connectWallet(address, {
      proof: tonProof.proof,
      stateInit: tonProof.walletStateInit,
      publicKey: Buffer.from(keyPair.publicKey).toString("hex"),
    });

    if (result?.["success"] === false) {
      const message = result["error"] || "Failed to connect the wallet";

      this.logger.error(message);
      return { status: false, message };
    }

    this.ctx.state.apply(result);

    if (!this.ctx.state.user()["walletOwned"]) {
      this.logger.warn("Wallet connected but its ownership was not accepted.");
    }

    this.logger.success(`Wallet connected and proven: ${address}`);

    return { status: true, message: "Wallet connected" };
  }

  /** Have the drop re-read the on-chain holding */
  async refreshHolding() {
    if (!this.getConnectedWalletAddress()) {
      this.logger.warn("No wallet connected.");
      return;
    }

    const result = await this.ctx.api.refreshWallet();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to refresh the wallet:", result["error"]);
      return;
    }

    this.ctx.state.apply(result);
    this.logger.keyValue(
      `On-chain ${TOKEN_SYMBOL}`,
      formatAmount(this.ctx.state.user()["walletBalance"]),
    );
  }
}
