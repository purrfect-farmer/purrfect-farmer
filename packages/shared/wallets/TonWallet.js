import { Address, SendMode, internal } from "@ton/core";
import { TonClient } from "@ton/ton";
import { createWallet, keypairFromMnemonic } from "../lib/ton/wallet.js";
import { getTonBalance } from "../lib/ton/tonapi.js";
import { waitForSeqnoChange } from "../lib/ton/transactions.js";

/** Endpoint transfers are broadcast through unless another is given */
const TONCENTER_ENDPOINT = "https://toncenter.com/api/v2/jsonRPC";

/** A wallet opened from its phrase, which derives its keys once and sends from them */
export default class TonWallet {
  /**
   * @param {object} options - { phrase, version, endpoint?, apiKey? }
   */
  constructor({ phrase, version, endpoint = TONCENTER_ENDPOINT, apiKey }) {
    this.phrase = phrase;
    this.version = Number(version);
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  /** Derive the keys and open the contract, once */
  open() {
    return (this.opened ||= (async () => {
      const keyPair = await keypairFromMnemonic(this.phrase);
      const wallet = createWallet(keyPair.publicKey, this.version);
      const client = new TonClient({
        endpoint: this.endpoint,
        apiKey: this.apiKey,
      });

      return { keyPair, wallet, contract: client.open(wallet) };
    })());
  }

  /** The wallet's address, non-bounceable (`UQ...`) by default */
  async getAddress({ bounceable = false } = {}) {
    const { wallet } = await this.open();

    return wallet.address.toString({ bounceable });
  }

  /** The wallet's TON balance */
  async getBalance(options) {
    return getTonBalance(await this.getAddress(), options);
  }

  /** The wallet's current seqno */
  async getSeqno() {
    const { contract } = await this.open();

    return contract.getSeqno();
  }

  /** Broadcast one or more transfers, returning the seqno they were sent at
   * @param {object|object[]} messages - { to, value, body?, bounce? }, `value` in nanotons or as a TON string
   */
  async send(messages, { sendMode } = {}) {
    const { keyPair, contract } = await this.open();
    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode:
        sendMode ?? SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: [].concat(messages).map(({ to, value, body, bounce = false }) =>
        internal({
          to: typeof to === "string" ? Address.parse(to) : to,
          value,
          bounce,
          body,
        }),
      ),
    });

    return seqno;
  }

  /** Wait until the wallet moves past the seqno a transfer was sent at */
  async waitForConfirmation(seqno) {
    const { contract } = await this.open();

    return waitForSeqnoChange(contract, seqno);
  }
}
