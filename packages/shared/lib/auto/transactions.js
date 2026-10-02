import { TonClient } from "@ton/ton";
import { createWallet, keypairFromMnemonic } from "../ton/wallet.js";
import { getJettonInfo } from "../ton/tonapi.js";
import { getJettonWalletAddress } from "../ton/transactions.js";

/** Prepares master wallet details once for reuse across operations
 * @param {object} master - { address, version, phrase, tonCenterApiKey? }
 * @param {string} jettonAddress - the drop's jetton master address
 * @returns {Promise<object>} - { client, wallet, contract, keyPair, jettonAddress, jettonWalletAddress, jettonBalance }
 */
export async function prepareMaster(master, jettonAddress) {
  const client = new TonClient({
    endpoint: "https://toncenter.com/api/v2/jsonRPC",
    apiKey: master.tonCenterApiKey,
  });

  const keyPair = await keypairFromMnemonic(master.phrase);
  const wallet = createWallet(keyPair.publicKey, master.version);
  const contract = client.open(wallet);

  console.log("Opened master contract!");

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
  };
}
