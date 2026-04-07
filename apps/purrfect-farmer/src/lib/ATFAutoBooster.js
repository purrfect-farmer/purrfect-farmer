import { Address, TonClient, internal, toNano } from "@ton/ton";
import { beginCell, storeStateInit } from "@ton/core";
import { mnemonicToPrivateKey, sha256, sign } from "@ton/crypto";

import {
  JETTON_ADDRESS,
  getJettonBalance,
  getWalletFromMnemonic,
  keypairFromMnemonic,
} from "./atf-auto";
import { extractTgWebAppData, uuid } from "@/utils";

import axios from "axios";

const TONAPI_BASE = "https://tonapi.io/v2";
const TON_FOR_GAS = toNano("0.1");
const JETTON_TRANSFER_GAS = toNano("0.05");

const ATF_API_BASE = "https://atfminers.asloni.online/miner/index.php";


async function getJettonWalletAddress(ownerAddress) {
  const res = await axios.get(
    `${TONAPI_BASE}/accounts/${ownerAddress}/jettons/${JETTON_ADDRESS}`
  );
  return res.data.wallet_address?.address;
}

function buildJettonTransferBody(toAddress, jettonAmount, decimals = 9) {
  const amount = BigInt(Math.round(jettonAmount * 10 ** decimals));
  return beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(0, 64)
    .storeCoins(amount)
    .storeAddress(Address.parse(toAddress))
    .storeAddress(Address.parse(toAddress))
    .storeBit(0)
    .storeCoins(1)
    .storeBit(0)
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
 * @param {object} master - { address, version, phrase, toncenterApiKey? }
 * @returns {Promise<object>} - { client, wallet, contract, keyPair, jettonWalletAddress, jettonBalance }
 */
export async function prepareMaster(master) {
  const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: master.toncenterApiKey,
  });
  const wallet = await getWalletFromMnemonic(master.phrase, master.version);
  const keyPair = await keypairFromMnemonic(master.phrase);
  const contract = client.open(wallet);
  const jettonWalletAddress = await getJettonWalletAddress(master.address);
  const jettonBalance = await getJettonBalance(master.address);

  return {
    client,
    wallet,
    contract,
    keyPair,
    jettonWalletAddress,
    jettonBalance,
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
      }
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
    const keyPair = await keypairFromMnemonic(this.account.phrase);
    const wallet = await getWalletFromMnemonic(
      this.account.phrase,
      this.account.version
    );

    const publicKey = keyPair.publicKey.toString("hex");
    const rawAddress = wallet.address.toRawString();
    const walletStateInit = beginCell()
      .store(storeStateInit(wallet.init))
      .endCell()
      .toBoc()
      .toString("base64");

    const { proof } = await this.buildWalletProof(wallet, keyPair.secretKey);

    const result = await this.syncWallet({
      publicKey,
      wallet: rawAddress,
      walletStateInit,
      network: "-239",
      proof,
    });

    return result;
  }

  // ─── TON Transfers (reuse prepared master) ──────────────

  async sendFromMaster(jettonAmount) {
    const { contract, keyPair, jettonWalletAddress } = this.prepared;
    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: Address.parse(jettonWalletAddress),
          value: JETTON_TRANSFER_GAS,
          body: buildJettonTransferBody(this.account.address, jettonAmount),
        }),
        internal({
          to: Address.parse(this.account.address),
          value: TON_FOR_GAS,
          bounce: false,
          body: beginCell()
            .storeUint(0, 32)
            .storeStringTail("ATF Auto")
            .endCell(),
        }),
      ],
    });

    await waitForSeqnoChange(contract, seqno);
  }

  async returnToMaster() {
    const jettonBalance = await getJettonBalance(this.account.address);
    const { client } = this.prepared;
    const wallet = await getWalletFromMnemonic(
      this.account.phrase,
      this.account.version
    );
    const keyPair = await keypairFromMnemonic(this.account.phrase);
    const contract = client.open(wallet);
    const seqno = await contract.getSeqno();

    const messages = [];

    if (jettonBalance > 0) {
      const subJettonWallet = await getJettonWalletAddress(
        this.account.address
      );
      if (subJettonWallet) {
        messages.push(
          internal({
            to: Address.parse(subJettonWallet),
            value: JETTON_TRANSFER_GAS,
            body: buildJettonTransferBody(this.master.address, jettonBalance),
          })
        );
      }
    }

    messages.push(
      internal({
        to: Address.parse(this.master.address),
        value: toNano("0"),
        bounce: false,
        body: beginCell()
          .storeUint(0, 32)
          .storeStringTail("Return")
          .endCell(),
      })
    );

    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages,
      sendMode: 128,
    });

    await waitForSeqnoChange(contract, seqno);
  }

  async sendGasFromMaster() {
    const { contract, keyPair } = this.prepared;
    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          to: Address.parse(this.account.address),
          value: TON_FOR_GAS,
          bounce: false,
          body: beginCell()
            .storeUint(0, 32)
            .storeStringTail("Collect Gas")
            .endCell(),
        }),
      ],
    });

    await waitForSeqnoChange(contract, seqno);
  }

  // ─── Operations ─────────────────────────────────────────

  async boost({ difference }) {
    try {
      await this.login();

      const minPercent = 100 - difference;
      const minAmount = (this.prepared.jettonBalance * minPercent) / 100;
      const currentHolding = this.getWalletHoldingAtf();

      if (currentHolding >= minAmount) {
        return { status: false, skipped: true, account: this.account };
      }

      const randomPercent = minPercent + Math.random() * difference;
      const jettonAmount = (this.prepared.jettonBalance * randomPercent) / 100;

      await this.sendFromMaster(jettonAmount);
      await this.connectWallet();
      await this.returnToMaster();

      return { status: true, account: this.account };
    } catch (error) {
      return { status: false, account: this.account, error };
    }
  }

  async collect() {
    try {
      const jettonBalance = await getJettonBalance(this.account.address);

      if (jettonBalance <= 0) {
        return { status: false, skipped: true, account: this.account };
      }

      await this.sendGasFromMaster();
      await this.returnToMaster();

      return { status: true, account: this.account };
    } catch (error) {
      return { status: false, account: this.account, error };
    }
  }
}
