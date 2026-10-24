/** The Auto verification step for drops that check the account first and connect the wallet before paying */
export default class WalletVerifier {
  /**
   * @param {object} options
   * @param {() => Promise<any>} options.ensureLoaded - reads the account
   * @param {() => boolean} options.isVerified - whether the drop already counts the account as verified
   * @param {() => boolean} options.hasWallet - whether a wallet is bound
   * @param {(wallet: { phrase: string, version: string|number }) => Promise<{ status: boolean, message?: string }>} options.connect - binds the wallet as an Auto does
   * @param {(wallet: { phrase: string, version: string|number, apiKey?: string }) => Promise<{ status: boolean, message?: string }>} options.pay - pays the verification unless it is settled or on its way
   * @param {() => object} options.summary - the drop's account summary
   * @param {() => Promise<object>} options.refreshSummary - re-reads the account and returns its summary
   * @param {string} [options.notConfirmedMessage] - reported when the payment has not been seen yet
   */
  constructor({
    ensureLoaded,
    isVerified,
    hasWallet,
    connect,
    pay,
    summary,
    refreshSummary,
    notConfirmedMessage = "Not confirmed yet",
  }) {
    this.ensureLoaded = ensureLoaded;
    this.isVerified = isVerified;
    this.hasWallet = hasWallet;
    this.connect = connect;
    this.pay = pay;
    this.summary = summary;
    this.refreshSummary = refreshSummary;
    this.notConfirmedMessage = notConfirmedMessage;
  }

  /** Pay the one-time verification from the wallet's phrase, connecting the wallet first when the account has none
   * @returns {Promise<{ status: boolean, skipped?: boolean, message?: string, summary?: object }>}
   */
  async verify({ phrase, version, apiKey }) {
    try {
      await this.ensureLoaded();

      if (this.isVerified()) {
        return {
          status: true,
          skipped: true,
          message: "Already verified",
          summary: this.summary(),
        };
      }

      if (!this.hasWallet()) {
        const connected = await this.connect({ phrase, version });

        if (!connected.status) return connected;
      }

      const { status, message } = await this.pay({ phrase, version, apiKey });

      return {
        status,
        skipped: false,
        message: message || (status ? "Verified" : this.notConfirmedMessage),
        summary: status ? await this.refreshSummary() : this.summary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }
}
