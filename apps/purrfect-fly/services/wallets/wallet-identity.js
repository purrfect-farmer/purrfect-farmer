import {
  createWallet,
  keyPairFromPhraseOrSecretKey,
} from "@purrfect/shared/lib/ton/wallet.js";

/** Public key and active address of a TON phrase, derived on the server */
export async function getTonWalletIdentity(phrase, version) {
  const { publicKey } = await keyPairFromPhraseOrSecretKey(phrase);
  const wallet = createWallet(publicKey, version);

  return {
    publicKey: publicKey.toString("hex"),
    address: wallet.address.toString({ bounceable: false }),
  };
}
