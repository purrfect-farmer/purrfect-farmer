import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";
import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";

/** A brand-new mnemonic, as a single space-separated phrase */
export async function generateMnemonicPhrase() {
  const mnemonic = await mnemonicNew();
  return mnemonic.join(" ");
}

export async function keypairFromMnemonic(mnemonic) {
  const keyPair = await mnemonicToPrivateKey(
    typeof mnemonic === "string" ? mnemonic.split(" ") : mnemonic,
  );
  return keyPair;
}

export function createWallet(publicKey, version) {
  return version === 4
    ? WalletContractV4.create({ workchain: 0, publicKey })
    : WalletContractV5R1.create({ workchain: 0, publicKey });
}

export async function getWalletFromMnemonic(mnemonic, version) {
  const keyPair = await keypairFromMnemonic(mnemonic);
  return createWallet(keyPair.publicKey, version);
}

export async function getWalletAddressFromMnemonic(mnemonic, version) {
  const wallet = await getWalletFromMnemonic(mnemonic, version);
  return wallet.address.toString({
    bounceable: false,
  });
}
