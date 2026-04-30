import { Address, internal, toNano } from "@ton/ton";
import {
  JETTON_ADDRESS,
  createWallet,
  getJettonInfo,
  keypairFromMnemonic,
} from "./atf-auto.js";
import {
  JETTON_TRANSFER_GAS,
  TON_FOR_GAS,
  buildJettonTransferBody,
  getJettonWalletAddress,
  waitForSeqnoChange,
} from "./atf-auto-transactions.js";

import Decimal from "decimal.js";
import { SendMode } from "@ton/core";

/**
 * ATFAutoBooster
 *
 * Handles boost and collect operations for ATF Auto.
 * Each instance is bound to a master account and a single sub account.
 *
 * Usage:
 *   const prepared = await prepareMaster(masterData);
 *   const booster = new BaseATFAutoBooster(masterData, accountData, prepared);
 *   await booster.boost({ difference: 10 });
 *   await booster.collect();
 */
export default class BaseATFAutoBooster {
  /**
   * @param {object} master - { address, version, phrase }
   * @param {object} account - { address, version, phrase }
   * @param {object} prepared - result of prepareMaster()
   */
  constructor(master, account, prepared) {
    this.master = master;
    this.account = account;
    this.prepared = prepared;

    // Lazy-prepared sub-account wallet/keyPair
    this._subPrepared = null;
  }

  async _prepareSubAccount() {
    if (!this._subPrepared) {
      const keyPair = await keypairFromMnemonic(this.account.phrase);
      const wallet = createWallet(keyPair.publicKey, this.account.version);
      this._subPrepared = {
        keyPair,
        wallet,
        contract: this.prepared.client.open(wallet),
      };
    }
    return this._subPrepared;
  }

  // ─── TON Transfers (reuse prepared master) ──────────────
  async sendGasFromMaster() {
    const { contract, keyPair } = this.prepared;
    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: [
        internal({
          to: Address.parse(this.account.address),
          value: TON_FOR_GAS,
          bounce: false,
        }),
      ],
    });

    await waitForSeqnoChange(contract, seqno);
  }

  async sendJettonFromMaster(jettonAmount, includeGas = false) {
    const { contract, keyPair, jettonWalletAddress, jettonDecimals } =
      this.prepared;
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
            this.account.address,
            this.master.address,
          ),
        }),
        ,
      ].concat(
        includeGas
          ? [
              internal({
                to: Address.parse(this.account.address),
                value: TON_FOR_GAS,
                bounce: false,
              }),
            ]
          : [],
      ),
    });

    await waitForSeqnoChange(contract, seqno);
    return jettonAmount;
  }

  async sendJettonAndGasFromMaster(jettonAmount) {
    return this.sendJettonFromMaster(jettonAmount, true);
  }

  async returnTonToMaster() {
    const { contract, keyPair } = await this._prepareSubAccount();
    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.CARRY_ALL_REMAINING_BALANCE,
      messages: [
        internal({
          to: Address.parse(this.master.address),
          value: toNano("0"),
          bounce: false,
        }),
      ],
    });

    await waitForSeqnoChange(contract, seqno);
  }

  async returnJettonToMaster(jettonBalance) {
    const { client, jettonDecimals } = this.prepared;
    const { contract, keyPair } = await this._prepareSubAccount();

    if (jettonBalance.lessThanOrEqualTo(0)) return jettonBalance;

    const subJettonWallet = await getJettonWalletAddress(
      client,
      JETTON_ADDRESS,
      this.account.address,
    );

    if (!subJettonWallet) return jettonBalance;

    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: subJettonWallet,
          value: JETTON_TRANSFER_GAS,
          body: buildJettonTransferBody(
            jettonDecimals,
            jettonBalance,
            this.master.address,
            this.account.address,
          ),
        }),
      ],
    });

    await waitForSeqnoChange(contract, seqno);
    return jettonBalance;
  }

  // ─── Operations ─────────────────────────────────────────
  async boost({ difference }) {
    try {
      const balance = new Decimal(this.prepared.jettonBalance);
      const minPercent = new Decimal(100).minus(difference);
      const randomPercent = minPercent.plus(
        new Decimal(Decimal.random()).mul(difference),
      );

      const jettonAmount = Decimal.min(
        balance,
        balance.mul(randomPercent).div(100),
      ).toDecimalPlaces(4, Decimal.ROUND_DOWN);

      /** Send Jetton from master */
      this.sendJettonFromMaster(jettonAmount);

      return { status: true, account: this.account, jettonAmount };
    } catch (error) {
      console.log("Error while boosting account", error);
      return { status: false, account: this.account, error };
    }
  }

  async collect() {
    try {
      console.log("Fetching Jetton Balance...");
      const { balance: jettonBalance } = await getJettonInfo(
        this.account.address,
      );

      if (jettonBalance.lessThanOrEqualTo(0)) {
        console.log("Skipping due to low Jetton balance!");
        return { status: false, skipped: true, account: this.account };
      }
      const { contract } = await this._prepareSubAccount();
      const balance = await contract.getBalance();

      /** Send Gas */
      if (balance < TON_FOR_GAS) {
        await this.sendGasFromMaster(TON_FOR_GAS);
      }

      /** Return Jetton */
      await this.returnJettonToMaster(jettonBalance);

      /** Return TON */
      await this.returnTonToMaster();

      return { status: true, account: this.account, collected: jettonBalance };
    } catch (error) {
      console.log("Error while collecting from account", error);
      return { status: false, skipped: false, account: this.account, error };
    }
  }
}
