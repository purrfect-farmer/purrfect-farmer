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
  constructor(oldMaster, newMaster) {
    this.oldMaster = oldMaster;
    this.newMaster = newMaster;
  }

  /** Main entry point to perform the wallet rotation */
  async rotate() {
    /** Prepare master for rotation */
    this.prepared = await prepareMaster(this.oldMaster);

    /** Send assets from old master to new master */
    if (this.prepared.jettonBalance > 0) {
      const jettonAmount = this.prepared.jettonBalance;

      /** Send Jetton from master */
      await toast.promise(this.sendJettonToNewMaster(), {
        loading: `Sending ${jettonAmount} ATF to new master`,
        success: `Sent ${jettonAmount} ATF to new master`,
      });
    }

    /** Send TON to new master */
    try {
      const balance = await this.prepared.contract.getBalance();

      if (balance > 0) {
        await toast.promise(this.sendTonToNewMaster(), {
          loading: `Sending TON to new master`,
          success: `Sent TON to new master`,
        });
      }
    } catch (error) {
      console.error("Error sending TON:", error);
      toast.error("Failed to send TON.");
    }
  }

  /** Send Jetton from old master to new master */
  async sendJettonToNewMaster() {
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
            this.newMaster.address,
            this.oldMaster.address,
          ),
        }),
      ],
    });

    await waitForSeqnoChange(contract, seqno);
    return jettonAmount;
  }

  /** Send remaining TON to new master */
  async sendTonToNewMaster() {
    const { contract, keyPair } = this.prepared;
    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.CARRY_ALL_REMAINING_BALANCE,
      messages: [
        internal({
          to: Address.parse(this.newMaster.address),
          value: toNano("0"),
          bounce: false,
        }),
      ],
    });

    await waitForSeqnoChange(contract, seqno);
  }
}
