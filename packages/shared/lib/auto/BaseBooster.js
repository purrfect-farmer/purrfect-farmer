import { Address, internal, toNano } from "@ton/ton";
import { createWallet, keypairFromMnemonic } from "../ton/wallet.js";
import { getJettonInfo } from "../ton/tonapi.js";
import {
  JETTON_TRANSFER_GAS,
  TON_FOR_GAS,
  buildJettonTransferBody,
  getJettonWalletAddress,
  sendAndConfirm,
} from "../ton/transactions.js";

import Decimal from "decimal.js";
import { SendMode } from "@ton/core";
import { NATIVE_TON_DUST, fromNanoDecimal } from "./native.js";
import { COLLECT_SKIP_REASONS, planCollect } from "./collectPlan.js";

/** Boosts and collects one sub account, moving `prepared.jettonAddress` to and from the master, or TON on a native Auto */
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
    await sendAndConfirm(
      contract,
      keyPair,
      [
        internal({
          to: Address.parse(this.account.address),
          value,
          bounce: false,
        }),
      ],
      SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    );
  }

  async sendJettonFromMaster(jettonAmount, includeGas = false) {
    const { contract, keyPair, jettonWalletAddress, jettonDecimals } =
      this.prepared;
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
      SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    );
    return jettonAmount;
  }

  /** Send TON from the master as the boosted asset, which is how a native Auto boosts */
  async sendTonFromMaster(amount) {
    const { contract, keyPair } = this.prepared;
    await sendAndConfirm(
      contract,
      keyPair,
      [
        internal({
          to: Address.parse(this.account.address),
          value: toNano(amount.toFixed(9)),
          bounce: false,
        }),
      ],
      SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    );
    return amount;
  }

  /** Send the boosted asset, jetton or TON depending on the Auto */
  sendAssetFromMaster(amount) {
    return this.prepared.native
      ? this.sendTonFromMaster(amount)
      : this.sendJettonFromMaster(amount);
  }

  async sendJettonAndGasFromMaster(jettonAmount) {
    return this.sendJettonFromMaster(jettonAmount, true);
  }

  async returnTonToMaster() {
    const { contract, keyPair } = await this._prepareSubAccount();
    await sendAndConfirm(
      contract,
      keyPair,
      [
        internal({
          to: Address.parse(this.master.address),
          value: toNano("0"),
          bounce: false,
        }),
      ],
      SendMode.CARRY_ALL_REMAINING_BALANCE,
    );
  }

  /** Send part of a sub account's TON to the master, the rest staying behind to pay the fee */
  async sendTonToMaster(amount) {
    const { contract, keyPair } = await this._prepareSubAccount();
    await sendAndConfirm(
      contract,
      keyPair,
      [
        internal({
          to: Address.parse(this.master.address),
          value: toNano(amount.toFixed(9, Decimal.ROUND_DOWN)),
          bounce: false,
        }),
      ],
      SendMode.PAY_GAS_SEPARATELY,
    );
    return amount;
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

    await sendAndConfirm(contract, keyPair, [
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
    ]);
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
      const transfer = this.sendAssetFromMaster(jettonAmount).then(
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

  /** The result of a collect that moved nothing */
  skippedCollect(reason, retained = new Decimal(0)) {
    return {
      status: false,
      skipped: true,
      reason,
      account: this.account,
      collected: new Decimal(0),
      retained,
      error: null,
    };
  }

  /** Return a sub account's TON to the master, the whole of a native Auto's collect */
  async collectTon(options) {
    const { contract } = await this._prepareSubAccount();
    const balance = await contract.getBalance();

    if (balance <= NATIVE_TON_DUST) {
      console.log("Skipping due to low TON balance!");
      return this.skippedCollect(COLLECT_SKIP_REASONS.EMPTY);
    }

    const total = fromNanoDecimal(balance);
    const { amount, retain, reason } = planCollect(total, options);

    if (reason) {
      console.log("Skipping TON collection:", reason);
      return this.skippedCollect(reason, retain);
    }

    if (retain.lte(0)) {
      await this.returnTonToMaster();
    } else {
      /** Whatever stays behind pays the fee, so it is never less than dust */
      const sent = Decimal.min(
        amount,
        total.minus(fromNanoDecimal(NATIVE_TON_DUST)),
      );
      await this.sendTonToMaster(sent);

      return {
        status: true,
        skipped: false,
        reason: null,
        account: this.account,
        collected: sent,
        retained: total.minus(sent),
        error: null,
      };
    }

    return {
      status: true,
      skipped: false,
      reason: null,
      account: this.account,
      collected: total,
      retained: new Decimal(0),
      error: null,
    };
  }

  /**
   * @param {object} [options]
   * @param {string} [options.retainMin] - least to leave on the account
   * @param {string} [options.retainMax] - most to leave, picked at random from min
   * @param {string} [options.minCollect] - skip when less than this would be collected
   */
  async collect(options = {}) {
    try {
      if (this.prepared.native) {
        return await this.collectTon(options);
      }

      console.log("Fetching Jetton Balance...");
      const { balance: jettonBalance } = await getJettonInfo(
        this.prepared.jettonAddress,
        this.account.address,
      );

      const { amount, retain, reason } = planCollect(jettonBalance, options);

      if (reason) {
        console.log("Skipping Jetton collection:", reason);
        return this.skippedCollect(reason, retain);
      }

      const { contract } = await this._prepareSubAccount();
      const balance = await contract.getBalance();

      /** Send Gas */
      if (balance < TON_FOR_GAS) {
        await this.sendGasFromMaster(TON_FOR_GAS);
      }

      /** Return Jetton */
      await this.returnJettonToMaster(amount);

      /** Return TON */
      await this.returnTonToMaster();

      return {
        status: true,
        skipped: false,
        reason: null,
        account: this.account,
        collected: amount,
        retained: retain,
        error: null,
      };
    } catch (error) {
      console.log("Error while collecting from account", error);
      return {
        status: false,
        skipped: false,
        reason: null,
        account: this.account,
        collected: new Decimal(0),
        retained: new Decimal(0),
        error,
      };
    }
  }
}
