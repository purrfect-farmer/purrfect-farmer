import {
  TONCENTER_CHUNK_SIZE,
  chunk,
  fetchAccountStates,
  fetchJettonDecimals,
  fetchJettonWallets,
  toRawAddress,
} from "./toncenter.js";

import Decimal from "decimal.js";

/** How long calls are collected before a batch is sent
 * react-query's useQueries fan-out spans more than one microtask tick
 */
export const BATCH_WINDOW = 30;

const batches = new Map();

/** Batches sharing a key are sent as one request */
function batchKey(jettonAddress, apiKey) {
  return `${jettonAddress}|${apiKey ?? ""}`;
}

/** Sends one chunk and settles only its own waiters */
async function runChunk(jettonAddress, apiKey, waiters) {
  const addresses = [...new Set(waiters.map((waiter) => waiter.raw))];

  try {
    const [tonBalances, jettonBalances, decimals] = await Promise.all([
      fetchAccountStates(addresses, { apiKey }),
      fetchJettonWallets(jettonAddress, addresses, { apiKey }),
      fetchJettonDecimals(jettonAddress, { apiKey }),
    ]);

    const divisor = new Decimal(10).pow(decimals);

    for (const waiter of waiters) {
      const jetton = jettonBalances.get(waiter.raw);
      waiter.resolve({
        /* Toncenter omits accounts with no on-chain state */
        ton: tonBalances.get(waiter.raw) || new Decimal(0),
        jetton: jetton ? jetton.div(divisor) : new Decimal(0),
      });
    }
  } catch (e) {
    for (const waiter of waiters) waiter.reject(e);
  }
}

/** Sends every pending waiter for one batch key */
function flush(key, jettonAddress, apiKey) {
  const batch = batches.get(key);
  if (!batch) return;

  batches.delete(key);

  for (const waiters of chunk(batch.waiters, TONCENTER_CHUNK_SIZE)) {
    runChunk(jettonAddress, apiKey, waiters);
  }
}

/** Queues a balance read, coalescing it with every other call in the same window */
export function queueBalanceRequest(jettonAddress, address, { apiKey } = {}) {
  const raw = toRawAddress(address);
  if (!raw) return Promise.reject(new Error(`Invalid address: ${address}`));

  const key = batchKey(jettonAddress, apiKey);

  return new Promise((resolve, reject) => {
    let batch = batches.get(key);

    if (!batch) {
      batch = { waiters: [], timeoutId: null };
      batches.set(key, batch);
      batch.timeoutId = setTimeout(
        () => flush(key, jettonAddress, apiKey),
        BATCH_WINDOW,
      );
    }

    batch.waiters.push({ raw, resolve, reject });
  });
}
