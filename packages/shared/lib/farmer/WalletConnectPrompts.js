import {
  deriveMnemonicFromTelegramId,
  getWalletAddressFromMnemonic,
} from "../ton/wallet.js";
import { promptWalletVersion } from "./prompts.js";

/** The interactive ways every Auto drop binds a wallet it does not have the phrase typed in for */
export default class WalletConnectPrompts {
  /**
   * @param {object} options
   * @param {ReturnType<import("./createFarmerCore.js").default>} options.core
   * @param {(wallet: { phrase?: string, address?: string, version: string|number }) => Promise<{ status: boolean, message?: string }>} options.connect - binds the wallet as an Auto does
   * @param {() => Promise<any>} [options.ensureLoaded] - reads the account first
   * @param {(wallet: { phrase: string, version: string|number }) => Promise<void>} [options.afterConnected] - the drop's follow-up once a wallet with a known phrase is bound
   */
  constructor({ core, connect, ensureLoaded = null, afterConnected = null }) {
    this.core = core;
    this.connect = connect;
    this.ensureLoaded = ensureLoaded;
    this.afterConnected = afterConnected;
  }

  /** Bind the wallet derived from this account's Telegram ID, as the TON Wallet Deriver builds it */
  async connectDerived() {
    const { core } = this;
    const id = core.userId();

    if (!id) {
      core.logger.warn("No Telegram ID to derive the wallet from.");
      return;
    }

    const passphrase = (
      (await core.prompt("Enter the passphrase (leave empty for none):")) || ""
    ).trim();

    const version = await promptWalletVersion(core);

    if (!version) {
      core.logger.warn("No wallet version selected.");
      return;
    }

    const words = await deriveMnemonicFromTelegramId(id, passphrase);

    core.logger.keyValue(
      "Derived Wallet",
      await getWalletAddressFromMnemonic(words, Number(version)),
    );

    await this.ensureLoaded?.();

    const { status, message } = await this.connect({
      phrase: words.join(" "),
      version,
    });

    if (!status) {
      core.logger.error("Failed to connect the derived wallet:", message);
      return;
    }

    core.logger.success("Derived wallet connected.");
    await this.afterConnected?.({ phrase: words.join(" "), version });
  }

  /** Bind a wallet held by an Auto account, asking for the Auto password only when the drop needs the phrase */
  async connectFromAuto() {
    const { core } = this;
    const sources = (await core.autoWalletProvider?.getSources()) || [];

    if (!sources.length) {
      core.logger.warn("No Auto with wallets set up.");
      return;
    }

    const source = await this.pickSource(sources);

    if (!source) {
      core.logger.warn("No Auto selected.");
      return;
    }

    const account = await this.pickAccount(source);

    if (!account) {
      core.logger.warn("No account selected.");
      return;
    }

    let phrase;

    if (core.drop.auto?.connectWithPhrase) {
      const password = await core.prompt({
        type: "password",
        text: `Enter the ${source.title} password:`,
      });

      if (!password) {
        core.logger.warn("No password provided.");
        return;
      }

      try {
        phrase = await source.decryptPhrase(account, password);
      } catch (error) {
        core.logger.error("Failed to unlock the wallet:", error.message);
        return;
      }
    }

    core.logger.keyValue(
      "Auto Wallet",
      core.utils.toFriendlyAddress(account.address),
    );

    await this.ensureLoaded?.();

    const { status, message } = await this.connect({
      phrase,
      address: account.address,
      version: account.version,
    });

    if (!status) {
      core.logger.error("Failed to connect the Auto wallet:", message);
      return;
    }

    core.logger.success("Auto wallet connected.");

    if (phrase) {
      await this.afterConnected?.({ phrase, version: account.version });
    } else {
      core.logger.info(
        "Connected without the phrase; run Verify separately if the drop needs it.",
      );
    }
  }

  /** The Auto to take the wallet from, asked for only when there is a choice */
  async pickSource(sources) {
    const sourceId =
      sources.length === 1
        ? sources[0].id
        : await this.core.prompt({
            type: "select",
            text: "Select Auto:",
            options: sources.map((item) => ({
              value: item.id,
              label: item.own ? `${item.title} (this drop)` : item.title,
            })),
          });

    return sources.find((item) => item.id === sourceId);
  }

  /** The Auto account to take the wallet from, with this Telegram account's own listed first */
  async pickAccount(source) {
    const { core } = this;
    const userId = String(core.userId());
    const isLinked = (account) => String(account.userId) === userId;
    const accounts = [
      ...source.accounts.filter(isLinked),
      ...source.accounts.filter((account) => !isLinked(account)),
    ];

    const accountId = await core.prompt({
      type: "select",
      text: `Select ${source.title} account:`,
      options: accounts.map((account) => {
        const address = core.utils.toFriendlyAddress(account.address);
        const label = [
          account.title,
          `${address.slice(0, 4)}...${address.slice(-4)}`,
          Number(account.version) === 4 ? "V4" : "V5R1",
        ].join(" · ");

        return {
          value: account.id,
          label: isLinked(account) ? `${label} (this account)` : label,
        };
      }),
    });

    return accounts.find((item) => item.id === accountId);
  }
}
