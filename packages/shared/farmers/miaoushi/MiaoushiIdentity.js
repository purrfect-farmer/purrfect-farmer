import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { X_EPOCH, X_USERNAME_MAX_LENGTH } from "./constants.js";
import { deriveEvmWalletFromTelegramId } from "../../lib/evm/wallet.js";
import { deriveUsername } from "../../utils/profile.js";

/** The account's Telegram id and everything derived from it */
export default class MiaoushiIdentity extends FarmerModule {
  #userId = null;

  /** The Telegram user id, read from the client when there is no initData */
  async userId() {
    if (!this.#userId) {
      const id = this.core.userId() ?? (await this.core.client?.getMe())?.id;
      this.#userId = id ? String(id) : null;
    }

    if (!this.#userId) throw new Error("Telegram user id is unavailable");

    return this.#userId;
  }

  /** The EVM wallet derived from the user id */
  async wallet() {
    return deriveEvmWalletFromTelegramId(await this.userId());
  }

  /** The wallet address the entry is made with */
  async address() {
    return (await this.wallet()).address;
  }

  /** The X handle derived from the user id */
  async xUsername() {
    return deriveUsername(await this.userId(), X_USERNAME_MAX_LENGTH);
  }

  /** A quote-post link on the derived handle, with an id from a few minutes ago */
  async quoteLink() {
    const minutesAgo = 2 + Math.floor(Math.random() * 10);
    const time = BigInt(Date.now() - minutesAgo * 60_000);
    const sequence = BigInt(Math.floor(Math.random() * 2 ** 22));
    const postId = ((time - X_EPOCH) << 22n) | sequence;

    return `https://x.com/${await this.xUsername()}/status/${postId}`;
  }

  /** Log the derived wallet's private key */
  async logPrivateKey() {
    this.logger.keyValue("Private Key", (await this.wallet()).privateKey);
  }

  /** Log the derived wallet and handle */
  async logInfo() {
    this.logger.keyValue("Wallet", await this.address());
    this.logger.keyValue("X", `@${await this.xUsername()}`);
  }
}
