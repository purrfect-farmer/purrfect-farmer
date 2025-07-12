import {
  ACCOUNT_SLOT,
  storeAccountData,
  writeSlotSession,
} from "./multiaccount";
import {
  DC_IDS,
  DEBUG,
  IS_SCREEN_LOCKED_CACHE_KEY,
  SESSION_ACCOUNT_PREFIX,
  SESSION_LEGACY_USER_KEY,
} from "../config";
export function hasStoredSession() {
  if (checkSessionLocked()) {
    return true;
  }
  const slotData = loadSlotSession(ACCOUNT_SLOT);
  if (slotData) return Boolean(slotData.dcId);
  if (!ACCOUNT_SLOT) {
    const legacyAuthJson = localStorage.getItem(SESSION_LEGACY_USER_KEY);
    if (legacyAuthJson) {
      try {
        const userAuth = JSON.parse(legacyAuthJson);
        return Boolean(userAuth && userAuth.id && userAuth.dcID);
      } catch (err) {
        // Do nothing.
        return false;
      }
    }
  }
  return false;
}
export function storeSession(sessionData) {
  const { mainDcId, keys, isTest } = sessionData;
  const currentSlotData = loadSlotSession(ACCOUNT_SLOT);
  const newSlotData = {
    ...currentSlotData,
    dcId: mainDcId,
    isTest,
  };
  Object.keys(keys)
    .map(Number)
    .forEach((dcId) => {
      newSlotData[`dc${dcId}_auth_key`] = keys[dcId];
    });
  if (!ACCOUNT_SLOT) {
    storeLegacySession(sessionData, currentSlotData?.userId);
  }
  writeSlotSession(ACCOUNT_SLOT, newSlotData);
}
function storeLegacySession(sessionData, currentUserId) {
  const { mainDcId, keys, isTest } = sessionData;
  localStorage.setItem(
    SESSION_LEGACY_USER_KEY,
    JSON.stringify({
      dcID: mainDcId,
      id: currentUserId,
      test: isTest,
    })
  );
  localStorage.setItem("dc", String(mainDcId));
  Object.keys(keys)
    .map(Number)
    .forEach((dcId) => {
      localStorage.setItem(`dc${dcId}_auth_key`, JSON.stringify(keys[dcId]));
    });
}
export function clearStoredSession(slot) {
  if (!slot) {
    clearStoredLegacySession();
  }
  localStorage.removeItem(`${SESSION_ACCOUNT_PREFIX}${slot || 1}`);
}
function clearStoredLegacySession() {
  [
    SESSION_LEGACY_USER_KEY,
    "dc",
    ...DC_IDS.map((dcId) => `dc${dcId}_auth_key`),
    ...DC_IDS.map((dcId) => `dc${dcId}_hash`),
    ...DC_IDS.map((dcId) => `dc${dcId}_server_salt`),
  ].forEach((key) => {
    localStorage.removeItem(key);
  });
}
export function loadStoredSession() {
  if (!hasStoredSession()) {
    return undefined;
  }
  const slotData = loadSlotSession(ACCOUNT_SLOT);
  if (!slotData) {
    if (ACCOUNT_SLOT) return undefined;
    return loadStoredLegacySession();
  }
  const sessionData = {
    mainDcId: slotData.dcId,
    keys: DC_IDS.reduce((acc, dcId) => {
      const key = slotData[`dc${dcId}_auth_key`];
      if (key) {
        acc[dcId] = key;
      }
      return acc;
    }, {}),
    isTest: slotData.isTest || undefined,
  };
  return sessionData;
}
function loadStoredLegacySession() {
  if (!hasStoredSession()) {
    return undefined;
  }
  const userAuth = JSON.parse(
    localStorage.getItem(SESSION_LEGACY_USER_KEY) || "null"
  );
  if (!userAuth) {
    return undefined;
  }
  const mainDcId = Number(userAuth.dcID);
  const isTest = userAuth.test;
  const keys = {};
  DC_IDS.forEach((dcId) => {
    try {
      const key = localStorage.getItem(`dc${dcId}_auth_key`);
      if (key) {
        keys[dcId] = JSON.parse(key);
      }
    } catch (err) {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.warn("Failed to load stored session", err);
      }
      // Do nothing.
    }
  });
  if (!Object.keys(keys).length) return undefined;
  return {
    mainDcId,
    keys,
    isTest,
  };
}
export function loadSlotSession(slot) {
  try {
    const data = JSON.parse(
      localStorage.getItem(`${SESSION_ACCOUNT_PREFIX}${slot || 1}`) || "{}"
    );
    if (!data.dcId) return undefined;
    return data;
  } catch (e) {
    return undefined;
  }
}
export function updateSessionUserId(currentUserId) {
  const slotData = loadSlotSession(ACCOUNT_SLOT);
  if (!slotData) return;
  storeAccountData(ACCOUNT_SLOT, { userId: currentUserId });
}
export function importTestSession() {
  const sessionJson = import.meta.env.VITE_TW_TEST_SESSION;
  try {
    const sessionData = JSON.parse(sessionJson);
    storeLegacySession(sessionData, sessionData.userId);
  } catch (err) {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.warn("Failed to load test session", err);
    }
  }
}
export function checkSessionLocked() {
  return localStorage.getItem(IS_SCREEN_LOCKED_CACHE_KEY) === "true";
}
