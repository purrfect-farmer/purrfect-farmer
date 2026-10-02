import { beginCell, storeStateInit } from "@ton/core";
import { sha256, sign } from "@ton/crypto";

/** The wallet's StateInit as a base64 BOC, the way TonConnect reports it */
export function getWalletStateInit(wallet) {
  return beginCell()
    .store(storeStateInit(wallet.init))
    .endCell()
    .toBoc()
    .toString("base64");
}

/** Sign a TonConnect `ton_proof` for a wallet, shaped as the wallet's connect item returns it */
export async function buildTonProof({
  wallet,
  secretKey,
  domain,
  payload,
  timestamp = Math.floor(Date.now() / 1000),
}) {
  const domainBuffer = Buffer.from(domain, "utf8");
  const domainLenBuffer = Buffer.alloc(4);
  domainLenBuffer.writeUInt32LE(domainBuffer.length);

  const workchainBuffer = Buffer.alloc(4);
  workchainBuffer.writeInt32BE(wallet.address.workChain);

  const timestampBuffer = Buffer.alloc(8);
  // buffer@5 polyfill has no BigInt methods, so write the u64 as two u32 halves
  timestampBuffer.writeUInt32LE(timestamp % 2 ** 32, 0);
  timestampBuffer.writeUInt32LE(Math.floor(timestamp / 2 ** 32), 4);

  const message = Buffer.concat([
    Buffer.from("ton-proof-item-v2/", "utf8"),
    workchainBuffer,
    wallet.address.hash,
    domainLenBuffer,
    domainBuffer,
    timestampBuffer,
    Buffer.from(payload, "utf8"),
  ]);

  const fullMessage = Buffer.concat([
    Buffer.from([0xff, 0xff]),
    Buffer.from("ton-connect", "utf8"),
    await sha256(message),
  ]);

  const signature = sign(await sha256(fullMessage), secretKey);

  return {
    address: wallet.address.toRawString(),
    walletStateInit: getWalletStateInit(wallet),
    proof: {
      timestamp,
      domain: {
        lengthBytes: domainBuffer.length,
        value: domain,
      },
      payload,
      signature: signature.toString("base64"),
    },
  };
}
