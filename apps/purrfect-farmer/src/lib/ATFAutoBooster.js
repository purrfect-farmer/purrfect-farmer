import { Address, TonClient, internal, toNano } from "@ton/ton";
import {
  JETTON_ADDRESS,
  createWallet,
  getJettonInfo,
  keypairFromMnemonic,
} from "./atf-auto";
import { SendMode, beginCell, fromNano } from "@ton/core";

import Decimal from "decimal.js";
import toast from "react-hot-toast";

const TON_FOR_GAS = toNano("0.08");
const JETTON_TRANSFER_GAS = toNano("0.05");

async function getJettonWalletAddress(client, jettonMaster, ownerAddress) {
  const res = await client.runMethod(
    Address.parse(jettonMaster),
    "get_wallet_address",
    [
      {
        type: "slice",
        cell: beginCell().storeAddress(Address.parse(ownerAddress)).endCell(),
      },
    ],
  );

  return res.stack.readAddress();
}

function buildJettonTransferBody(
  toAddress,
  jettonAmount,
  responseAddress,
  decimals,
) {
  const amount = BigInt(
    new Decimal(jettonAmount)
      .mul(new Decimal(10).pow(decimals))
      .floor()
      .toFixed(0),
  );

  return beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(0, 64)
    .storeCoins(amount)
    .storeAddress(Address.parse(toAddress)) // destination
    .storeAddress(Address.parse(responseAddress)) // response destination
    .storeBit(0) // no custom payload
    .storeCoins(0) // no forward TON
    .storeBit(0) // no forward payload
    .endCell();
}

async function waitForSeqnoChange(contract, previousSeqno, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const currentSeqno = await contract.getSeqno();
      if (currentSeqno > previousSeqno) return;
    } catch {
      // ignore
    }
  }
  throw new Error("Transaction timeout - seqno did not change");
}

/**
 * Prepares master wallet details once for reuse across operations.
 *
 * @param {object} master - { address, version, phrase, tonCenterApiKey? }
 * @returns {Promise<object>} - { client, wallet, contract, keyPair, jettonWalletAddress, jettonBalance }
 */
export async function prepareMaster(master) {
  const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: master.tonCenterApiKey,
  });

  const keyPair = await keypairFromMnemonic(master.phrase);
  const wallet = createWallet(keyPair.publicKey, master.version);
  const contract = client.open(wallet);

  const jettonWalletAddress = await getJettonWalletAddress(
    client,
    JETTON_ADDRESS,
    master.address,
  );

  const { balance: jettonBalance, decimals: jettonDecimals } =
    await getJettonInfo(master.address);

  return {
    client,
    wallet,
    contract,
    keyPair,
    jettonWalletAddress,
    jettonBalance,
    jettonDecimals,
  };
}

/**
 * ATFAutoBooster
 *
 * Handles boost and collect operations for ATF Auto.
 * Each instance is bound to a master account and a single sub account.
 *
 * Usage:
 *   const prepared = await prepareMaster(masterData);
 *   const booster = new ATFAutoBooster(masterData, accountData, prepared);
 *   await booster.boost({ difference: 10 });
 *   await booster.collect();
 */
export default class ATFAutoBooster {
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
            this.account.address,
            jettonAmount,
            this.master.address,
            jettonDecimals,
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
            this.master.address,
            jettonBalance,
            this.account.address,
            jettonDecimals,
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
      await toast.promise(this.sendJettonFromMaster(jettonAmount), {
        loading: `Sending ${jettonAmount} ATF from master`,
        success: `Sent ${jettonAmount} ATF from master`,
      });

      return { status: true, account: this.account };
    } catch (error) {
      return { status: false, account: this.account, error };
    }
  }

  async collect() {
    try {
      const { balance: jettonBalance } = await getJettonInfo(
        this.account.address,
      );

      if (jettonBalance.lessThanOrEqualTo(0)) {
        return { status: false, skipped: true, account: this.account };
      }
      const { contract } = await this._prepareSubAccount();
      const balance = await contract.getBalance();

      /** Send Gas */
      if (balance < TON_FOR_GAS) {
        await toast.promise(this.sendGasFromMaster(), {
          loading: `Sending ${fromNano(TON_FOR_GAS)} TON from master`,
          success: `Sent ${fromNano(TON_FOR_GAS)} TON from master`,
        });
      }

      /** Return Jetton */
      await toast.promise(this.returnJettonToMaster(jettonBalance), {
        loading: `Returning ${jettonBalance} ATF to master`,
        success: `Returned ${jettonBalance} ATF to master`,
      });

      /** Return TON */
      await toast.promise(this.returnTonToMaster(), {
        loading: "Returning TON to master",
        success: "TON returned to master",
      });

      return { status: true, account: this.account, collected: jettonBalance };
    } catch (error) {
      return { status: false, account: this.account, error };
    }
  }
}
