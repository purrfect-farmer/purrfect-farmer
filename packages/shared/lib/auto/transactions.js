import { TonClient } from "@ton/ton";
import { createWallet, keypairFromMnemonic } from "../ton/wallet.js";
import { getJettonInfo } from "../ton/tonapi.js";
import { getJettonWalletAddress } from "../ton/transactions.js";
import { createToncenterAdapter } from "./toncenter.js";
import {
  NATIVE_TON_RESERVE,
  fromNanoDecimal,
  isNativeJetton,
} from "./native.js";

/** Prepares master wallet details once for reuse across operations
 * @param {object} master - { address, version, phrase, tonCenterApiKey? }
 * @param {string|null} jettonAddress - the drop's jetton master address, or null for a native TON Auto
 * @returns {Promise<object>} - { client, wallet, contract, keyPair, jettonAddress, jettonWalletAddress, jettonBalance, jettonDecimals, native }
 * A native Auto's `jettonBalance` is the master's TON above the fee reserve, since TON is what it moves
 */
export async function prepareMaster(master, jettonAddress) {
  const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: master.tonCenterApiKey,
    httpAdapter: createToncenterAdapter(master.tonCenterApiKey),
  });

  const keyPair = await keypairFromMnemonic(master.phrase);
  const wallet = createWallet(keyPair.publicKey, master.version);
  const contract = client.open(wallet);

  console.log("Opened master contract!");

  if (isNativeJetton(jettonAddress)) {
    const nanotons = await contract.getBalance();
    const spendable = nanotons > NATIVE_TON_RESERVE ? nanotons - NATIVE_TON_RESERVE : 0n;

    console.log("Retrieved master TON balance!");

    return {
      client,
      wallet,
      contract,
      keyPair,
      jettonAddress: null,
      jettonWalletAddress: null,
      jettonBalance: fromNanoDecimal(spendable),
      jettonDecimals: 9,
      native: true,
    };
  }

  const jettonWalletAddress = await getJettonWalletAddress(
    client,
    jettonAddress,
    master.address,
  );

  console.log("Retrieved master Jetton wallet address!");

  const { balance: jettonBalance, decimals: jettonDecimals } =
    await getJettonInfo(jettonAddress, master.address);

  return {
    client,
    wallet,
    contract,
    keyPair,
    jettonAddress,
    jettonWalletAddress,
    jettonBalance,
    jettonDecimals,
    native: false,
  };
}
