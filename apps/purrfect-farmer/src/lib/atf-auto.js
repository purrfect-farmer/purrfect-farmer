import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";
import { extractTgWebAppData, uuid } from "@/utils";

import Decimal from "decimal.js";
import axios from "axios";
import { mnemonicToPrivateKey } from "@ton/crypto";

export const JETTON_ADDRESS =
  "EQANcW45W0Tp91bzvHayaPO6-6hf1Lm4XlWZ4rN6L5ofPWdb";

const TON_API_DELAY = 300;

/** Serialized fetcher for tonapi.io — one request at a time with rate limit gap. */
const tonapi = axios.create({ baseURL: "https://tonapi.io/v2" });
let _pending = Promise.resolve();

export function fetchTonApi(url) {
  return (_pending = _pending
    .catch(() => {})
    .then(() => tonapi.get(url))
    .finally(() => new Promise((r) => setTimeout(r, TON_API_DELAY))));
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

export async function getTonBalance(address) {
  const res = await fetchTonApi(`/accounts/${address}`);
  return Number(res.data.balance) / 1e9;
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

/** Serialized fetcher for ATF API — one request at a time with rate limit gap. */
const ATF_API_BASE = "https://atfminers.asloni.online/miner/index.php";
const ATF_API_DELAY = 300;
let _atfPending = Promise.resolve();

function fetchAtfApi(action, url) {
  const { initData, initDataUnsafe } = extractTgWebAppData(url);
  const userId = initDataUnsafe?.user?.id;
  const username = initDataUnsafe?.user?.username;

  return (_atfPending = _atfPending
    .catch(() => {})
    .then(() =>
      axios.post(
        `${ATF_API_BASE}?action=${action}&t=${Date.now()}`,
        {
          initData,
          request_id: uuid(),
          tg_id: userId,
          username,
        },
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "X-Telegram-Init-Data": initData,
          },
        },
      ),
    )
    .finally(() => new Promise((r) => setTimeout(r, ATF_API_DELAY))));
}

export async function getWalletHolding(url) {
  const res = await fetchAtfApi("login", url);
  return new Decimal(res.data?.user?.wallet_holding_atf || 0);
}
