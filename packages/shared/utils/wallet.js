import TonWallet from "../wallets/TonWallet.js";

/** Open a wallet from its phrase */
export function createTonWallet(options) {
  return new TonWallet(options);
}
