import BaseTelegramWebClient from "../lib/BaseTelegramWebClient.js";
import { MemorySession } from "telegram/sessions/index.js";
import {
  TELEGRAM_DEVICE_MODEL as DEVICE_MODEL,
  TELEGRAM_SYSTEM_VERSION as SYSTEM_VERSION,
} from "./telegramClient.js";

export { DEVICE_MODEL, SYSTEM_VERSION };

export function getTelegramDcManager() {
  if (!globalThis.TelegramDcManager) {
    globalThis.TelegramDcManager = {
      dcClient: null,
      dcClientPromise: null,
      cachedDcInfo: new Map(),
    };
  }

  return globalThis.TelegramDcManager;
}

/** Create telegram client */
export function createTelegramClient(session, options) {
  return new BaseTelegramWebClient(session, {
    deviceModel: DEVICE_MODEL,
    systemVersion: SYSTEM_VERSION,
    useWSS: true,
    ...options,
  });
}

/**
 * Get DC Client
 * @returns {Promise<BaseTelegramWebClient>}
 */
export async function getDcClient() {
  const manager = getTelegramDcManager();
  if (manager.dcClient) {
    return manager.dcClient;
  }

  if (!manager.dcClientPromise) {
    manager.dcClientPromise = (async () => {
      const memorySession = new MemorySession();

      const client = createTelegramClient(memorySession);

      await client.connect();

      manager.dcClient = client;
      return client;
    })();
  }

  return manager.dcClientPromise;
}

/**
 * Get DC details
 * @param {number} dcId
 */
export async function getDcDetails(dcId) {
  const manager = getTelegramDcManager();
  if (manager.cachedDcInfo.has(dcId)) {
    return manager.cachedDcInfo.get(dcId);
  }

  const client = await getDcClient();
  const info = await client.execute(() => client.getDC(dcId));

  manager.cachedDcInfo.set(dcId, info);

  return info;
}
