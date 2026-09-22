/** Parcel URL from Environment Variables */
export const PARCEL_URL = import.meta.env.VITE_PARCEL_URL;

/** Parcel only receives the accounts once it reaches Split or Merge */
export const PARCEL_READY_MESSAGE = "ready";

/** Native TON, recognized by Parcel as the token without an address */
export const NATIVE_TON_TOKEN = {
  id: "ton",
  name: "Toncoin",
  symbol: "TON",
};

/** Build the token Parcel should preselect */
export function getParcelToken(config, useNativeTon) {
  if (useNativeTon) {
    return NATIVE_TON_TOKEN;
  }

  /** Decimals are omitted, Parcel resolves them from TonAPI */
  return {
    id: config.token.toLowerCase(),
    name: config.token,
    symbol: config.token,
    address: config.jettonAddress,
  };
}

/** Map a decrypted wallet into the shape Parcel expects */
function toParcelWallet({ address, phrase, version }) {
  return { address, mnemonic: phrase, version };
}

/**
 * Build the payload Parcel reads on handshake.
 * The master funds a Split and receives a Merge, the accounts are both the
 * Split recipients and the Merge senders.
 */
export function buildParcelPayload({ masterData, accounts, token }) {
  return {
    group: "ton",
    blockchain: "ton",
    config: { apiKey: masterData.tonCenterApiKey || "" },
    token,
    wallet: toParcelWallet(masterData),
    receiver: masterData.address,
    recipients: accounts.map((account) => account.address),
    senders: accounts.map(toParcelWallet),
  };
}
