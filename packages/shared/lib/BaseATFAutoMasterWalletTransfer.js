import { Address, SendMode, internal, toNano } from "@ton/core";
import {
  JETTON_TRANSFER_GAS,
  buildJettonTransferBody,
  prepareMaster,
  waitForSeqnoChange,
} from "./atf-auto-transactions";

/**
 * BaseATFAutoMasterWalletTransfer
 */
export default class BaseATFAutoMasterWalletTransfer {
  constructor(master, address) {
    this.master = master;
    this.address = address;
  }

  /** Main entry point to perform the wallet transfer */
  async transfer() {
    /* Log the start of the transfer process */
    console.log("Starting master wallet transfer process...");
    console.log("Received address for transfer:", this.address);

    /** Prepare master for transfer */
    this.prepared = await prepareMaster(this.master);

    /* Log the prepared master details */
    console.log("Master wallet prepared for transfer:", this.prepared);

    /** Send assets from master to address */
    if (this.prepared.jettonBalance > 0) {
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
    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: [
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
    });

    await waitForSeqnoChange(contract, seqno);
    return jettonAmount;
  }

  /** Send remaining TON to address */
  async sendTonToAddress() {
    const { contract, keyPair } = this.prepared;
    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.CARRY_ALL_REMAINING_BALANCE,
      messages: [
        internal({
          to: Address.parse(this.address),
          value: toNano("0"),
          bounce: false,
        }),
      ],
    });

    await waitForSeqnoChange(contract, seqno);
  }
}
