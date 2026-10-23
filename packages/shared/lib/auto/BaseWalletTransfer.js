import { Address, SendMode, internal, toNano } from "@ton/core";
import {
  JETTON_TRANSFER_GAS,
  buildJettonTransferBody,
  sendAndConfirm,
} from "../ton/transactions.js";
import { prepareMaster } from "./transactions.js";

/** Drains a master wallet, the drop's jetton (if it has one) plus all remaining TON, into an arbitrary address */
export default class BaseWalletTransfer {
  constructor(master, address, jettonAddress) {
    this.master = master;
    this.address = address;
    this.jettonAddress = jettonAddress;
  }

  /** Main entry point to perform the wallet transfer */
  async transfer() {
    /* Log the start of the transfer process */
    console.log("Starting wallet transfer process...");
    console.log("Received address for transfer:", this.address);

    /** Prepare master for transfer */
    this.prepared = await prepareMaster(this.master, this.jettonAddress);

    /* Log the prepared master details, without its key pair */
    console.log("Wallet prepared for transfer:", {
      native: this.prepared.native,
      jettonAddress: this.prepared.jettonAddress,
      jettonWalletAddress: this.prepared.jettonWalletAddress,
      jettonBalance: this.prepared.jettonBalance,
      jettonDecimals: this.prepared.jettonDecimals,
    });

    /** Send assets from master to address */
    if (!this.prepared.native && this.prepared.jettonBalance > 0) {
      const jettonAmount = this.prepared.jettonBalance;

      /** Send Jetton from master */
      await this.sendJettonToAddress(jettonAmount);
    }

    /** Send TON to address */
    try {
      const balance = await this.prepared.contract.getBalance();

      if (balance > 0) {
        await this.sendTonToAddress(balance);
      }
    } catch (error) {
      console.error("Error sending TON:", error);
    }
  }

  /** Send Jetton from master to address */
  async sendJettonToAddress() {
    const { contract, keyPair, jettonWalletAddress, jettonDecimals } =
      this.prepared;

    const jettonAmount = this.prepared.jettonBalance;
    await sendAndConfirm(
      contract,
      keyPair,
      [
        internal({
          to: jettonWalletAddress,
          value: JETTON_TRANSFER_GAS,
          body: buildJettonTransferBody(
            jettonDecimals,
            jettonAmount,
            this.address,
            this.master.address,
          ),
        }),
      ],
      SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    );
    return jettonAmount;
  }

  /** Send remaining TON to address */
  async sendTonToAddress() {
    const { contract, keyPair } = this.prepared;
    await sendAndConfirm(
      contract,
      keyPair,
      [
        internal({
          to: Address.parse(this.address),
          value: toNano("0"),
          bounce: false,
        }),
      ],
      SendMode.CARRY_ALL_REMAINING_BALANCE,
    );
  }
}
