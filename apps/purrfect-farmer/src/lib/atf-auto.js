import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";

import axios from "axios";
import { mnemonicToPrivateKey } from "@ton/crypto";

export const JETTON_ADDRESS =
  "EQANcW45W0Tp91bzvHayaPO6-6hf1Lm4XlWZ4rN6L5ofPWdb";

const TONAPI_BASE = "https://tonapi.io/v2";

export function singleQueue(fn) {
  let running = false;
  const queue = [];

  async function processQueue() {
    if (running) return;
    running = true;

    while (queue.length) {
      const { args, resolve, reject } = queue.shift();

      try {
        const result = await fn(...args);
        resolve(result);
      } catch (err) {
        reject(err);
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    running = false;
  }

  return function queuedFn(...args) {
    return new Promise((resolve, reject) => {
      queue.push({ args, resolve, reject });
      processQueue();
    });
  };
}

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

export const getTonBalance = singleQueue(async function (address) {
  const res = await axios.get(`${TONAPI_BASE}/accounts/${address}`);
  return Number(res.data.balance) / 1e9;
});

export const getJettonBalance = singleQueue(async function (ownerAddress) {
  const res = await axios.get(
    `${TONAPI_BASE}/accounts/${ownerAddress}/jettons/${JETTON_ADDRESS}`,
  );
  if (!res.data.balance) return 0;
  const decimals = Number(res.data.jetton?.metadata?.decimals || 9);
  return Number(res.data.balance) / 10 ** decimals;
});

export const getBalances = singleQueue(async (address) => {
  const [ton, jetton] = await Promise.all([
    getTonBalance(address).catch(() => 0),
    getJettonBalance(address).catch(() => 0),
  ]);

  return { ton, jetton };
});
