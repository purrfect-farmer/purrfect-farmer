import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";

import { mnemonicToPrivateKey } from "@ton/crypto";

export async function keypairFromMnemonic(mnemonic) {
  const keyPair = await mnemonicToPrivateKey(mnemonic.split(" "));
  return keyPair;
}

export async function getWalletFromMnemonic(mnemonic, version) {
  const keyPair = await keypairFromMnemonic(mnemonic);
  const workchain = 0;
  const wallet =
    version === 4
      ? WalletContractV4.create({
          workchain,
          publicKey: keyPair.publicKey,
        })
      : WalletContractV5R1.create({
          workchain,
          publicKey: keyPair.publicKey,
        });

  return wallet;
}

export async function getWalletAddressFromMnemonic(mnemonic, version) {
  const wallet = await getWalletFromMnemonic(mnemonic, version);
  return wallet.address.toString({
    bounceable: false,
  });
}
