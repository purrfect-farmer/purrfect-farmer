import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";

import Decimal from "decimal.js";
import axios from "axios";
import { mnemonicToPrivateKey } from "@ton/crypto";

/** Wraps a function so calls are queued and run one at a time. */
function serialized(fn) {
  let pending = Promise.resolve();
  const delay = () => new Promise((r) => setTimeout(r, 1000));
  return (...args) =>
    (pending = pending
      .catch(() => {})
      .then(() => fn(...args))
      .finally(delay));
}

/** Creates an axios instance. */
function createApi(baseURL) {
  const instance = axios.create({ baseURL });
  return instance;
}

export const tonapi = createApi("https://tonapi.io/v2");
export const fetchTonApi = serialized((url, options) => {
  return tonapi.get(url, options);
});

export async function getTonBalance(address, options) {
  const res = await fetchTonApi(`/accounts/${address}`, options);
  return new Decimal(res.data.balance || 0).div(1e9);
}

export async function getJettonInfo(jettonAddress, ownerAddress, options) {
  const res = await fetchTonApi(
    `/accounts/${ownerAddress}/jettons/${jettonAddress}`,
    options,
  ).catch((e) => {
    console.log("Failed to fetch balance", e);
  });

  /* TonAPI puts `decimals` on the jetton preview; older shapes nested it */
  const jetton = res?.data?.jetton;
  const decimals = Number(jetton?.decimals ?? jetton?.metadata?.decimals ?? 9);
  const balance = res?.data?.balance
    ? new Decimal(res?.data?.balance).div(new Decimal(10).pow(decimals))
    : new Decimal(0);

  return { balance, decimals };
}

export async function getJettonBalance(jettonAddress, ownerAddress, options) {
  const { balance } = await getJettonInfo(jettonAddress, ownerAddress, options);
  return balance;
}

export async function getBalances(jettonAddress, address, options) {
  const [ton, jetton] = await Promise.all([
    getTonBalance(address, options).catch(() => new Decimal(0)),
    getJettonBalance(jettonAddress, address, options).catch(
      () => new Decimal(0),
    ),
  ]);

  return { ton, jetton };
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

export function searchAutoAccount(account, searchTerm) {
  if (account.userId?.toString().toLowerCase().includes(searchTerm))
    return true;
  if (account.title?.toLowerCase().includes(searchTerm)) return true;
  if (account.address?.toLowerCase().includes(searchTerm)) return true;

  return false;
}
