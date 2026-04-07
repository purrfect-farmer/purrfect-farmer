import { Address, TonClient, internal, toNano } from "@ton/ton";
import {
  JETTON_ADDRESS,
  createWallet,
  getJettonInfo,
  keypairFromMnemonic,
} from "./atf-auto";
import { SendMode, beginCell, storeStateInit } from "@ton/core";
import { extractTgWebAppData, uuid } from "@/utils";
import { sha256, sign } from "@ton/crypto";

import Decimal from "decimal.js";
import axios from "axios";
import toast from "react-hot-toast";

const TON_FOR_GAS = toNano("0.1");
const JETTON_TRANSFER_GAS = toNano("0.05");
const ATF_API_BASE = "https://atfminers.asloni.online/miner/index.php";

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
  senderAddress,
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
    .storeAddress(Address.parse(senderAddress)) // response destination
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
   * @param {object} account - { address, version, phrase, url }
   * @param {object} prepared - result of prepareMaster()
   */
  constructor(master, account, prepared) {
    this.master = master;
    this.account = account;
    this.prepared = prepared;

    // ATF API state
    this.initData = null;
    this.authData = null;
    this.tmaSessionToken = null;

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

  // ─── ATF API ────────────────────────────────────────────

  extractInitData() {
    const { initData, initDataUnsafe } = extractTgWebAppData(this.account.url);
    this.initData = initData;
    this.initDataUnsafe = initDataUnsafe;
    return { initData, initDataUnsafe };
  }

  getUserId() {
    return this.initDataUnsafe?.user?.id;
  }

  getUsername() {
    return this.initDataUnsafe?.user?.username;
  }

  async makeAction(action, data = {}) {
    const res = await axios.post(
      `${ATF_API_BASE}?action=${action}&t=${Date.now()}`,
      {
        ...data,
        initData: this.initData,
        request_id: uuid(),
        tg_id: this.getUserId(),
      },
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "X-Telegram-Init-Data": this.initData,
          "X-ATF-TMA-Session": this.tmaSessionToken || "",
        },
      },
    );
    return res.data;
  }

  async login() {
    this.extractInitData();
    this.authData = await this.makeAction("login", {
      username: this.getUsername(),
    });
    this.tmaSessionToken = this.authData?.tma_session_token;
    return this.authData;
  }

  getWalletHoldingAtf() {
    return Number(this.authData?.user?.wallet_holding_atf || 0);
  }

  getWalletProofPayload() {
    return this.makeAction("get_wallet_proof_payload");
  }

  syncWallet({ publicKey, wallet, walletStateInit, network, proof }) {
    return this.makeAction("sync_wallet", {
      public_key: publicKey,
      wallet,
      wallet_state_init: walletStateInit || "",
      network: network || "",
      proof: proof || null,
    });
  }

  async buildWalletProof(walletContract, secretKey) {
    const proofPayloadData = await this.getWalletProofPayload();
    const payload = proofPayloadData.payload;

    const timestamp = Math.floor(Date.now() / 1000);
    const domain = "atftoken.com";
    const domainBuffer = Buffer.from(domain, "utf8");
    const domainLenBuffer = Buffer.alloc(4);
    domainLenBuffer.writeUInt32LE(domainBuffer.length);

    const workchainBuffer = Buffer.alloc(4);
    workchainBuffer.writeInt32BE(walletContract.address.workChain);

    const timestampBuffer = Buffer.alloc(8);
    timestampBuffer.writeUInt32LE(timestamp & 0xffffffff, 0);
    timestampBuffer.writeUInt32LE(Math.floor(timestamp / 0x100000000), 4);

    const message = Buffer.concat([
      Buffer.from("ton-proof-item-v2/", "utf8"),
      workchainBuffer,
      walletContract.address.hash,
      domainLenBuffer,
      domainBuffer,
      timestampBuffer,
      Buffer.from(payload, "utf8"),
    ]);

    const messageHash = await sha256(message);
    const fullMessage = Buffer.concat([
      Buffer.from([0xff, 0xff]),
      Buffer.from("ton-connect", "utf8"),
      messageHash,
    ]);
    const fullMessageHash = await sha256(fullMessage);
    const signature = sign(fullMessageHash, secretKey);

    return {
      payload,
      proof: {
        timestamp,
        domain: {
          lengthBytes: domainBuffer.length,
          value: domain,
        },
        payload,
        signature: signature.toString("base64"),
      },
    };
  }

  async connectWallet() {
    const { keyPair, wallet } = await this._prepareSubAccount();

    const publicKey = keyPair.publicKey.toString("hex");
    const rawAddress = wallet.address.toRawString();
    const walletStateInit = beginCell()
      .store(storeStateInit(wallet.init))
      .endCell()
      .toBoc()
      .toString("base64");

    const { proof } = await this.buildWalletProof(wallet, keyPair.secretKey);

    return this.syncWallet({
      publicKey,
      wallet: rawAddress,
      walletStateInit,
      network: "-239",
      proof,
    });
  }

  // ─── TON Transfers (reuse prepared master) ──────────────

  async sendJettonFromMaster(jettonAmount) {
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
      ],
    });

    await waitForSeqnoChange(contract, seqno);
    return jettonAmount;
  }

  async returnJettonToMaster() {
    const { client, jettonDecimals } = this.prepared;
    const { contract, keyPair } = await this._prepareSubAccount();

    const { balance: jettonBalance } = await getJettonInfo(
      this.account.address,
    );

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

  // ─── Operations ─────────────────────────────────────────

  async boost({ difference }) {
    try {
      await this.login();

      const balance = new Decimal(this.prepared.jettonBalance);

      const minPercent = new Decimal(100).minus(difference);
      const minAmount = balance.mul(minPercent).div(100);

      const currentHolding = new Decimal(this.getWalletHoldingAtf());

      if (currentHolding.greaterThanOrEqualTo(minAmount)) {
        return { status: false, skipped: true, account: this.account };
      }

      const randomPercent = minPercent.plus(
        new Decimal(Decimal.random()).mul(difference),
      );

      const jettonAmount = Decimal.min(
        balance,
        balance.mul(randomPercent).div(100),
      ).toDecimalPlaces(4, Decimal.ROUND_DOWN);

      await toast.promise(this.sendJettonFromMaster(jettonAmount), {
        loading: `Sending ${jettonAmount} ATF from master`,
        success: `Sent ${jettonAmount} ATF from master`,
      });
      await toast.promise(this.sendGasFromMaster(), {
        loading: "Sending 0.1 TON from master",
        success: "Sent 0.1 TON from master",
      });
      await toast.promise(this.connectWallet(), {
        loading: "Connecting wallet",
        success: "Wallet connected",
      });
      const { balance: returnBalance } = await getJettonInfo(
        this.account.address,
      );
      await toast.promise(this.returnJettonToMaster(), {
        loading: `Returning ${returnBalance} ATF to master`,
        success: `Returned ${returnBalance} ATF to master`,
      });
      await toast.promise(this.returnTonToMaster(), {
        loading: "Returning TON to master",
        success: "TON returned to master",
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

      await toast.promise(this.sendGasFromMaster(), {
        loading: "Sending 0.1 TON from master",
        success: "Sent 0.1 TON from master",
      });
      const collected = await toast.promise(this.returnJettonToMaster(), {
        loading: `Returning ${jettonBalance} ATF to master`,
        success: `Returned ${jettonBalance} ATF to master`,
      });
      await toast.promise(this.returnTonToMaster(), {
        loading: "Returning TON to master",
        success: "TON returned to master",
      });

      return { status: true, account: this.account, collected };
    } catch (error) {
      return { status: false, account: this.account, error };
    }
  }
}
