import { Address, TonClient, toNano } from "@ton/ton";
import {
  JETTON_ADDRESS,
  createWallet,
  getJettonInfo,
  keypairFromMnemonic,
} from "./atf-auto.js";

import Decimal from "decimal.js";
import { beginCell } from "@ton/core";

export const TON_FOR_GAS = toNano("0.08");
export const JETTON_TRANSFER_GAS = toNano("0.05");

export async function getJettonWalletAddress(
  client,
  jettonMaster,
  ownerAddress,
) {
  const res = await client.runMethod(
    Address.parse(jettonMaster),
    "get_wallet_address",
    [
      {
        type: "slice",
        cell: beginCell().storeAddress(Address.parse(ownerAddress)).endCell(),
      },
    ],
  );

  return res.stack.readAddress();
}

export function buildJettonTransferBody(
  decimals,
  jettonAmount,
  toAddress,
  responseAddress,
) {
  const amount = BigInt(
    new Decimal(jettonAmount)
      .mul(new Decimal(10).pow(decimals))
      .floor()
      .toFixed(0),
  );

  return beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(0, 64)
    .storeCoins(amount)
    .storeAddress(Address.parse(toAddress)) // destination
    .storeAddress(Address.parse(responseAddress)) // response destination
    .storeBit(0) // no custom payload
    .storeCoins(0) // no forward TON
    .storeBit(0) // no forward payload
    .endCell();
}

export async function waitForSeqnoChange(
  contract,
  previousSeqno,
  maxAttempts = 30,
) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const currentSeqno = await contract.getSeqno();
      if (currentSeqno > previousSeqno) return;
    } catch {
      // ignore
    }
  }
  throw new Error("Transaction timeout - seqno did not change");
}

/**
 * Prepares master wallet details once for reuse across operations.
 *
 * @param {object} master - { address, version, phrase, tonCenterApiKey? }
 * @returns {Promise<object>} - { client, wallet, contract, keyPair, jettonWalletAddress, jettonBalance }
 */
export async function prepareMaster(master) {
  const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: master.tonCenterApiKey,
  });

  const keyPair = await keypairFromMnemonic(master.phrase);
  const wallet = createWallet(keyPair.publicKey, master.version);
  const contract = client.open(wallet);

  const jettonWalletAddress = await getJettonWalletAddress(
    client,
    JETTON_ADDRESS,
    master.address,
  );

  const { balance: jettonBalance, decimals: jettonDecimals } =
    await getJettonInfo(master.address);

  return {
    client,
    wallet,
    contract,
    keyPair,
    jettonWalletAddress,
    jettonBalance,
    jettonDecimals,
  };
}
