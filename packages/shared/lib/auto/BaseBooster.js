import { Address, internal, toNano } from "@ton/ton";
import { createWallet, getJettonInfo, keypairFromMnemonic } from "./wallet.js";
import {
  JETTON_TRANSFER_GAS,
  TON_FOR_GAS,
  buildJettonTransferBody,
  getJettonWalletAddress,
  waitForSeqnoChange,
} from "./transactions.js";

import Decimal from "decimal.js";
import { SendMode } from "@ton/core";

/** Boosts and collects one sub account, moving `prepared.jettonAddress` to and from the master */
export default class BaseBooster {
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
  async sendGasFromMaster(value = TON_FOR_GAS) {
    const { contract, keyPair } = this.prepared;
    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: [
        internal({
          to: Address.parse(this.account.address),
          value,
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
    const { client, jettonAddress, jettonDecimals } = this.prepared;
    const { contract, keyPair } = await this._prepareSubAccount();

    if (jettonBalance.lessThanOrEqualTo(0)) return jettonBalance;

    const subJettonWallet = await getJettonWalletAddress(
      client,
      jettonAddress,
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
  async boost({ difference, amount = null, max = null }) {
    try {
      const balance = new Decimal(this.prepared.jettonBalance);

      /** Skipped rather than failed: connecting the wallet is still worth doing */
      if (balance.lessThanOrEqualTo(0)) {
        return {
          status: false,
          skipped: true,
          account: this.account,
          jettonAmount: new Decimal(0),
          transfer: null,
          error: null,
        };
      }

      /** A user-entered amount is what the run works with, never more than the master holds */
      const base = max ? Decimal.min(balance, new Decimal(max)) : balance;

      const minPercent = new Decimal(100).minus(difference);
      const randomPercent = minPercent.plus(
        new Decimal(Decimal.random()).mul(difference),
      );

      /** An explicit amount is what a reuse asks for, still capped by what the run works with */
      const jettonAmount = Decimal.min(
        base,
        amount ? new Decimal(amount) : base.mul(randomPercent).div(100),
      ).toDecimalPlaces(4, Decimal.ROUND_DOWN);

      /** Not awaited, so callers can overlap their own delay with the transfer.
       * It is settled here to keep the rejection handled, and handed back as
       * `transfer` for callers that need to know whether it landed. */
      const transfer = this.sendJettonFromMaster(jettonAmount).then(
        () => ({ status: true, error: null }),
        (error) => {
          console.log("Error while sending jetton from master", error);
          return { status: false, error };
        },
      );

      return {
        status: true,
        skipped: false,
        account: this.account,
        jettonAmount,
        transfer,
        error: null,
      };
    } catch (error) {
      console.log("Error while boosting account", error);
      return {
        status: false,
        skipped: false,
        account: this.account,
        jettonAmount: new Decimal(0),
        transfer: null,
        error,
      };
    }
  }

  async collect() {
    try {
      console.log("Fetching Jetton Balance...");
      const { balance: jettonBalance } = await getJettonInfo(
        this.prepared.jettonAddress,
        this.account.address,
      );

      if (jettonBalance.lessThanOrEqualTo(0)) {
        console.log("Skipping due to low Jetton balance!");
        return {
          status: false,
          skipped: true,
          account: this.account,
          collected: new Decimal(0),
          error: null,
        };
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

      return {
        status: true,
        skipped: false,
        account: this.account,
        collected: jettonBalance,
        error: null,
      };
    } catch (error) {
      console.log("Error while collecting from account", error);
      return {
        status: false,
        skipped: false,
        account: this.account,
        collected: new Decimal(0),
        error,
      };
    }
  }
}
