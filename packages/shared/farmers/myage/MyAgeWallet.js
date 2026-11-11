import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { buildTonProof } from "../../lib/ton/proof.js";
import { createWallet } from "../../lib/ton/wallet.js";
import { TON_PROOF_DOMAIN } from "./constants.js";

/** Linking the wallet withdrawals go to, with the TON proof the drop checks */
export default class MyAgeWallet extends FarmerModule {
  /** The address the drop has the account on, as `UQ...` */
  getConnectedWalletAddress() {
    const address = this.ctx.state.wallet();

    return address ? this.utils.toFriendlyAddress(address) : null;
  }

  /** The drop only links a wallet that signs a TON proof, so a bare address is refused */
  async connectWalletAddress(address) {
    await this.ctx.state.ensureLoaded();

    const connected = this.getConnectedWalletAddress();

    if (connected && this.utils.isSameTonAddress(connected, address)) {
      return { status: true, message: "Wallet already connected" };
    }

    const message = "My Age needs the wallet phrase to link a wallet";

    this.logger.warn(message);
    return { status: false, message };
  }

  /** Link the wallet a key pair controls, signing the TON proof the drop checks */
  async connectSignedWallet(keyPair, version) {
    const wallet = createWallet(keyPair.publicKey, Number(version));
    const address = wallet.address.toString({ bounceable: false });

    await this.ctx.state.ensureLoaded();

    /* Nothing to sign when the account is already on this wallet */
    const connected = this.getConnectedWalletAddress();

    if (connected && this.utils.isSameTonAddress(connected, address)) {
      return { status: true, message: "Wallet already connected" };
    }

    /* Sign a proof over the drop's single-use payload */
    const tonProof = await buildTonProof({
      wallet,
      secretKey: keyPair.secretKey,
      domain: TON_PROOF_DOMAIN,
      payload: await this.ctx.api.fetchProofPayload(),
    });

    try {
      const result = await this.ctx.api.connectWallet({
        address: tonProof.address,
        stateInit: tonProof.walletStateInit,
        proof: tonProof.proof,
      });

      this.ctx.state.user()["wallet"] = result["address"] || tonProof.address;
    } catch (error) {
      this.logger.error("Failed to link the wallet:", error.message);
      return { status: false, message: error.message };
    }

    this.logger.success(`Wallet linked: ${address}`);

    return { status: true, message: "Wallet connected" };
  }

  /** Unlink the account's wallet */
  async disconnectWallet() {
    await this.ctx.api.disconnectWallet();

    this.ctx.state.user()["wallet"] = null;
  }
}
