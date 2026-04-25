import { Address, SendMode, fromNano, internal, toNano } from "@ton/core";
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
    /* Log the start of the rotation process */
    console.log("Starting master wallet rotation process...");
    console.log("Received address for rotation:", this.address);

    /** Prepare master for rotation */
    this.prepared = await prepareMaster(this.master);

    /* Log the prepared master details */
    console.log("Master wallet prepared for rotation:", this.prepared);

    /** Send assets from master to address */
    if (this.prepared.jettonBalance > 0) {
      const jettonAmount = this.prepared.jettonBalance;

      /** Send Jetton from master */
      await toast.promise(this.sendJettonToAddress(), {
        loading: `Sending ${jettonAmount} ATF`,
        success: `Sent ${jettonAmount} ATF`,
      });
    }

    /** Send TON to address */
    try {
      const balance = await this.prepared.contract.getBalance();

      if (balance > 0) {
        await toast.promise(this.sendTonToAddress(), {
          loading: `Sending ${fromNano(balance)} TON`,
          success: `Sent ${fromNano(balance)} TON`,
        });
      }
    } catch (error) {
      console.error("Error sending TON:", error);
      toast.error("Failed to send TON.");
    }
  }

  /** Send Jetton from old master to address */
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
