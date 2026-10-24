import {
  getWalletAddressFromMnemonic,
  keyPairFromPhraseOrSecretKey,
} from "../ton/wallet.js";

/** Binds an Auto's wallet to the account, by address or by signing with its phrase */
export default class AutoWalletConnector {
  /**
   * @param {object} options
   * @param {(address: string) => Promise<{ status: boolean, message?: string }>} options.connectAddress - binds a bare address
   * @param {(keyPair: object, version: string|number) => Promise<{ status: boolean, message?: string }>} [options.connectSigned] - binds the wallet a key pair signs for, used whenever a phrase is given
   * @param {(version: string|number|undefined) => Promise<void>} options.rememberVersion - keeps the version the wallet was loaded with
   * @param {() => object} options.summary - the drop's account summary
   * @param {() => Promise<object>} options.refreshSummary - re-reads the account and returns its summary
   * @param {() => Promise<any>} [options.ensureLoaded] - reads the account first
   */
  constructor({
    connectAddress,
    connectSigned = null,
    rememberVersion,
    summary,
    refreshSummary,
    ensureLoaded = null,
  }) {
    this.connectAddress = connectAddress;
    this.connectSigned = connectSigned;
    this.rememberVersion = rememberVersion;
    this.summary = summary;
    this.refreshSummary = refreshSummary;
    this.ensureLoaded = ensureLoaded;
  }

  /** Link a TON wallet to the account and refresh the drop's view of it
   * @param {object} wallet - { phrase, address, version, refresh }
   * @returns {Promise<{ status: boolean, summary?: object, message?: string }>}
   */
  async connect({ phrase, address, version, refresh = false }) {
    try {
      await this.ensureLoaded?.();

      const { status, message } =
        phrase && this.connectSigned
          ? await this.connectSigned(
              await keyPairFromPhraseOrSecretKey(phrase),
              version,
            )
          : await this.connectAddress(
              address ||
                (await getWalletAddressFromMnemonic(phrase, Number(version))),
            );

      if (!status) {
        return { status: false, message };
      }

      await this.rememberVersion(version);

      return {
        status: true,
        summary: refresh ? await this.refreshSummary() : this.summary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }
}
