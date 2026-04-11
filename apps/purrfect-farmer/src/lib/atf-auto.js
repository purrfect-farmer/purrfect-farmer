import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";

import Decimal from "decimal.js";
import axios from "axios";
import { mnemonicToPrivateKey } from "@ton/crypto";

export const JETTON_ADDRESS =
  "EQANcW45W0Tp91bzvHayaPO6-6hf1Lm4XlWZ4rN6L5ofPWdb";

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
export const fetchTonApi = serialized((url) => tonapi.get(url));

export async function getTonBalance(address) {
  const res = await fetchTonApi(`/accounts/${address}`);
  return new Decimal(res.data.balance || 0).div(1e9);
}

export async function getJettonInfo(ownerAddress) {
  const res = await fetchTonApi(
    `/accounts/${ownerAddress}/jettons/${JETTON_ADDRESS}`,
  );

  const decimals = Number(res.data.jetton?.metadata?.decimals || 9);
  const balance = res.data.balance
    ? new Decimal(res.data.balance).div(new Decimal(10).pow(decimals))
    : new Decimal(0);

  return { balance, decimals };
}

export async function getJettonBalance(ownerAddress) {
  const { balance } = await getJettonInfo(ownerAddress);
  return balance;
}

export async function getBalances(address) {
  const [ton, jetton] = await Promise.all([
    getTonBalance(address).catch(() => 0),
    getJettonBalance(address).catch(() => 0),
  ]);

  return { ton, jetton };
}

export async function keypairFromMnemonic(mnemonic) {
  const keyPair = await mnemonicToPrivateKey(mnemonic.split(" "));
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
