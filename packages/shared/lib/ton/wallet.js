import {
  WalletContractV3R1,
  WalletContractV3R2,
  WalletContractV4,
  WalletContractV5R1,
} from "@ton/ton";
import {
  mnemonicNew,
  mnemonicToPrivateKey,
  mnemonicValidate,
  mnemonicWordList,
  sha512,
} from "@ton/crypto";

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

/** Mnemonic from SHA-512 of the ID, rehashed until it is a valid TON mnemonic */
export async function deriveMnemonicFromTelegramId(id, passphrase = "") {
  const text = passphrase ? `${id}:${passphrase}` : `${id}`;
  let hash = await sha512(text);

  while (true) {
    const words = [];
    for (let i = 0; i < 24; i++) {
      words.push(
        mnemonicWordList[((hash[2 * i] << 8) | hash[2 * i + 1]) % 2048],
      );
    }

    if (await mnemonicValidate(words)) return words;
    hash = await sha512(hash);
  }
}

/** Non-bounceable addresses of every common wallet version, newest first */
export function getWalletAddressesFromPublicKey(publicKey) {
  return [
    ["W5", WalletContractV5R1],
    ["V4R2", WalletContractV4],
    ["V3R2", WalletContractV3R2],
    ["V3R1", WalletContractV3R1],
  ].map(([version, Contract]) => ({
    version,
    address: Contract.create({ workchain: 0, publicKey }).address.toString({
      bounceable: false,
    }),
  }));
}
