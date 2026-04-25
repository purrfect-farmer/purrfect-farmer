import { Address, SendMode, internal, toNano } from "@ton/core";
import {
  JETTON_TRANSFER_GAS,
  buildJettonTransferBody,
  prepareMaster,
  waitForSeqnoChange,
} from "./atf-auto-transactions";

import toast from "react-hot-toast";

/**
 * ATFAutoMasterWalletRotation
 */
export default class ATFAutoMasterWalletRotation {
  constructor(master, address) {
    this.master = master;
    this.address = address;
  }

  /** Main entry point to perform the wallet rotation */
  async rotate() {
    /* Log the start of the rotation process and the new address */
    console.log("Starting master wallet rotation process...");
    console.log("Received new address for rotation:", this.address);

    /** Prepare master for rotation */
    this.prepared = await prepareMaster(this.master);

    /* Log the prepared master details */
    console.log("Master wallet prepared for rotation:", this.prepared);

    /** Send assets from master to new address */
    if (this.prepared.jettonBalance > 0) {
      const jettonAmount = this.prepared.jettonBalance;

      /** Send Jetton from master */
      await toast.promise(this.sendJettonToNewAddress(), {
        loading: `Sending ${jettonAmount} ATF to new address`,
        success: `Sent ${jettonAmount} ATF to new address`,
      });
    }

    /** Send TON to new address */
    try {
      const balance = await this.prepared.contract.getBalance();

      if (balance > 0) {
        await toast.promise(this.sendTonToNewAddress(), {
          loading: `Sending TON to new address`,
          success: `Sent TON to new address`,
        });
      }
    } catch (error) {
      console.error("Error sending TON:", error);
      toast.error("Failed to send TON.");
    }
  }

  /** Send Jetton from old master to new address */
  async sendJettonToNewAddress() {
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

  /** Send remaining TON to new address */
  async sendTonToNewAddress() {
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
