import { Address } from "@ton/core";

import Decimal from "decimal.js";
import axios from "axios";

/** Addresses per request; 50 keeps the query string near 4KB */
export const TONCENTER_CHUNK_SIZE = 50;

/* Toncenter allows ~1 req/s anonymously and ~10 req/s with a key */
const KEYED_INTERVAL = 120;
const ANONYMOUS_INTERVAL = 1000;
const MAX_RETRIES = 3;

const apiCache = new Map();
const decimalsCache = new Map();
const queues = new Map();

/** Normalizes any address form to raw `0:abc...` for matching across providers */
export function toRawAddress(address) {
  try {
    return Address.parse(address).toRawString();
  } catch {
    return null;
  }
}

/** Paces requests per API key so batches do not trip the rate limit
 * Retries on 429, honouring Retry-After when the server sends it
 */
function schedule(apiKey, send) {
  const cacheKey = apiKey || "";
  const interval = apiKey ? KEYED_INTERVAL : ANONYMOUS_INTERVAL;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const run = async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await send();
      } catch (e) {
        const retryAfter = e?.response?.headers?.["retry-after"];
        if (e?.response?.status !== 429 || attempt >= MAX_RETRIES) throw e;

        await wait(
          retryAfter ? Number(retryAfter) * 1000 : interval * 2 ** (attempt + 1),
        );
      }
    }
  };

  const pending = (queues.get(cacheKey) || Promise.resolve())
    .catch(() => {})
    .then(run);

  /* The queue tracks completion only, so one failure cannot break the chain */
  queues.set(
    cacheKey,
    pending.catch(() => {}).then(() => wait(interval)),
  );

  return pending;
}

/** Creates (and memoizes) an axios instance for a given API key */
export function createToncenterApi(apiKey) {
  const cacheKey = apiKey || "";
  if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

  const instance = axios.create({
    baseURL: "https://toncenter.com/api/v3",
    headers: apiKey ? { "X-API-Key": apiKey } : undefined,
  });

  apiCache.set(cacheKey, instance);
  return instance;
}

/** Splits a list into fixed-size chunks */
export function chunk(items, size = TONCENTER_CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** TON balances for many addresses in one request
 * Accounts with no on-chain state are omitted by Toncenter, so callers default them to zero
 */
export async function fetchAccountStates(addresses, { apiKey, signal } = {}) {
  const api = createToncenterApi(apiKey);
  const res = await schedule(apiKey, () =>
    api.get("/accountStates", {
      signal,
      params: { address: addresses, include_boc: false },
      paramsSerializer: { indexes: null },
    }),
  );

  const balances = new Map();
  for (const account of res.data?.accounts || []) {
    const raw = toRawAddress(account.address);
    if (raw) balances.set(raw, new Decimal(account.balance || 0).div(1e9));
  }

  return balances;
}

/** Undivided jetton balances for many owners in one request */
export async function fetchJettonWallets(
  jettonAddress,
  owners,
  { apiKey, signal } = {},
) {
  const api = createToncenterApi(apiKey);
  const res = await schedule(apiKey, () =>
    api.get("/jetton/wallets", {
      signal,
      params: {
        owner_address: owners,
        jetton_address: jettonAddress,
        limit: Math.max(owners.length, 1),
      },
      paramsSerializer: { indexes: null },
    }),
  );

  const balances = new Map();
  for (const wallet of res.data?.jetton_wallets || []) {
    const raw = toRawAddress(wallet.owner);
    if (raw) balances.set(raw, new Decimal(wallet.balance || 0));
  }

  return balances;
}

/** Jetton decimals, cached forever since they never change */
export async function fetchJettonDecimals(jettonAddress, { apiKey } = {}) {
  const cached = decimalsCache.get(jettonAddress);
  if (cached) return cached;

  const pending = (async () => {
    try {
      const api = createToncenterApi(apiKey);
      const res = await schedule(apiKey, () =>
        api.get("/jetton/masters", {
          params: { address: jettonAddress },
        }),
      );

      const master = res.data?.jetton_masters?.[0];
      return Number(master?.jetton_content?.decimals ?? 9);
    } catch (e) {
      decimalsCache.delete(jettonAddress);
      throw e;
    }
  })();

  decimalsCache.set(jettonAddress, pending);
  return pending;
}
