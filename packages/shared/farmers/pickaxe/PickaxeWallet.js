import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import { buildTonProof } from "../../lib/ton/proof.js";
import { createWallet } from "../../lib/ton/wallet.js";
import { PXE_TOKEN, TON_PROOF_DOMAIN } from "./constants.js";

/** Linking the wallet with its TON proof and reading its holding */
export default class PickaxeWallet extends FarmerModule {
  /** The address the drop has the account on, as `UQ...` */
  getConnectedWalletAddress() {
    const address = this.ctx.state.data?.["wallet"];

    return address ? this.utils.toFriendlyAddress(address) : null;
  }

  /** The drop only links a wallet that signs a TON proof, so a bare address is refused */
  async connectWalletAddress(address) {
    await this.ctx.state.ensureLoaded();

    const connected = this.getConnectedWalletAddress();

    if (connected && this.utils.isSameTonAddress(connected, address)) {
      return { status: true, message: "Wallet already connected" };
    }

    const message = "Pickaxe Empire needs the wallet phrase to link a wallet";

    this.logger.warn(message);
    return { status: false, message };
  }

  /** Link the wallet a key pair controls, signing the TON proof the drop checks */
  async connectSignedWallet(keyPair, version) {
    const wallet = createWallet(keyPair.publicKey, Number(version));
    const address = wallet.address.toString({ bounceable: false });

    await this.ctx.state.ensureLoaded();

    const connected = this.getConnectedWalletAddress();

    if (connected && this.utils.isSameTonAddress(connected, address)) {
      return { status: true, message: "Wallet already connected" };
    }

    const tonProof = await buildTonProof({
      wallet,
      secretKey: keyPair.secretKey,
      domain: TON_PROOF_DOMAIN,
      payload: await this.ctx.api.fetchProofPayload(),
    });

    try {
      this.ctx.state.apply(
        await this.ctx.api.connectWallet({
          address: tonProof.address,
          proof: tonProof.proof,
          stateInit: tonProof.walletStateInit,
          publicKey: Buffer.from(keyPair.publicKey).toString("hex"),
        }),
      );
    } catch (error) {
      this.logger.error("Failed to link the wallet:", error.message);
      return { status: false, message: error.message };
    }

    this.logger.success(`Wallet linked: ${address}`);

    return { status: true, message: "Wallet connected" };
  }

  /** Unlink the account's wallet */
  async disconnectWallet() {
    this.ctx.state.apply(await this.ctx.api.disconnectWallet());
  }

  /** The wallet opened from a phrase, when it is the linked one */
  async createSigner({ phrase, version, apiKey }) {
    const connected = this.getConnectedWalletAddress();
    const wallet = this.utils.wallet.createTonWallet({
      phrase,
      version: Number(version),
      apiKey,
    });

    if (!connected) return null;

    return this.utils.isSameTonAddress(connected, await wallet.getAddress())
      ? wallet
      : null;
  }

  /** Re-read the on-chain holding the drop counts */
  async refreshHolding() {
    await this.ctx.state.load();

    this.logger.keyValue(
      `On-chain ${PXE_TOKEN}`,
      formatAmount(this.ctx.state.holding()),
    );
  }
}
