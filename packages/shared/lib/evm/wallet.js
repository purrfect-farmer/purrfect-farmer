import { computeAddress, sha256, toUtf8Bytes } from "ethers";

/** EVM private key and address, the key being the SHA-256 of the ID */
export function deriveEvmWalletFromTelegramId(id, passphrase = "") {
  const text = passphrase ? `${id}:${passphrase}` : `${id}`;
  const privateKey = sha256(toUtf8Bytes(text));

  return { privateKey, address: computeAddress(privateKey) };
}
