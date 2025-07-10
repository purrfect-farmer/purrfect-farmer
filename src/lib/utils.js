import axios from "axios";
import defaultSharedSettings from "@/core/defaultSharedSettings";
import userAgents from "@/core/userAgents";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

export function isExtension() {
  return window.location.protocol === "chrome-extension:";
}

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function uuid() {
  return uuidv4();
}

export function createListener(callback) {
  const listener = (...args) => callback(listener, ...args);

  return listener;
}

export function createMutexFunction(callback) {
  let locked = false;
  return function (...args) {
    if (locked) return;
    /** Lock Function */
    locked = true;

    /** Execute original callback */
    callback(...args).finally(() => {
      locked = false;
    });
  };
}

export function customLogger(...args) {
  console.log("\n");
  args.forEach((item, index) => {
    if (index === 0) {
      console.log(`%c<<<<${item}>>>>`, "color:orange; font-weight:bold;");
    } else {
      console.log(item);
    }
  });
  console.log("\n");
}

export function delay(length, precised = false) {
  return new Promise((res) => {
    const delayTime = precised ? length : length * (1 + Math.random() * 0.5);
    setTimeout(res, delayTime);
  });
}

export function randomPercent(value, min = 0, max = 100) {
  return Math.floor(
    (value * (min + Math.floor(Math.random() * (max - min)))) / 100
  );
}

export function extraGamePoints(points) {
  return points + randomPercent(points, 0, 20);
}

export function delayForSeconds(length, precised = false) {
  return delay(length * 1000, precised);
}

export function delayForMinutes(length, precised = false) {
  return delay(length * 60 * 1000, precised);
}

/** Remove Account Storage */
export async function removeAccountStorage(id) {
  /** Get all Keys */
  const keys = await chrome.storage.local.getKeys();

  /** Keys to Remove */
  const keysToRemove = keys.filter((item) => item.startsWith(`account-${id}:`));

  /** Remove Keys */
  await chrome.storage.local.remove(keysToRemove);
}

export async function getChromeLocalStorage(key, defaultValue) {
  if (typeof chrome?.storage?.local !== "undefined") {
    const { [key]: value } = await chrome?.storage?.local.get({
      [key]: defaultValue,
    });
    return value;
  } else {
    return defaultValue;
  }
}

export async function setChromeLocalStorage(key, value) {
  await chrome?.storage?.local.set({
    [key]: value,
  });
}

export async function removeChromeLocalStorage(key) {
  await chrome?.storage?.local.remove(key);
}

export async function getSharedSettings() {
  const sharedSettings = await getChromeLocalStorage(
    "shared:settings",
    defaultSharedSettings
  );

  return {
    ...defaultSharedSettings,
    ...sharedSettings,
  };
}

export async function getUserAgent() {
  return await getChromeLocalStorage(
    "shared:user-agent",
    userAgents[Math.floor(Math.random() * userAgents.length)]
  );
}

export async function storeUserAgent(value) {
  return await setChromeLocalStorage("shared:user-agent", value);
}

export function isElementVisible(element) {
  if (!element) return false;

  /** Get computed Styles */
  const style = window.getComputedStyle(element);

  const isEnabled = element.disabled !== true;
  const isDisplayed = style.display !== "none";
  const isVisible = style.visibility !== "hidden";
  const hasOpacity = parseFloat(style.opacity) > 0;

  return isEnabled && isDisplayed && isVisible && hasOpacity;
}

/** Dispatch Click Event on Element */
export function dispatchClickEventOnElement(element, { clientX, clientY }) {
  /** Mouse Events */
  ["mousedown", "click", "mouseup"].forEach((eventType) => {
    element.dispatchEvent(
      new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
      })
    );
  });

  const touch = new Touch({
    identifier: Date.now(),
    target: element,
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
    pageX: clientX,
    pageY: clientY,
  });

  /** Touch Events */
  ["touchstart", "touchend"].forEach((eventType) => {
    element.dispatchEvent(
      new TouchEvent(eventType, {
        bubbles: true,
        cancelable: true,
        touches: [touch],
        changedTouches: [touch],
      })
    );
  });
}

export function clickElementCenter(element) {
  if (element) {
    const coords = getElementCenter(element);
    return dispatchClickEventOnElement(element, coords);
  }
}

export function getElementCenter(element) {
  const rect = element.getBoundingClientRect();

  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;

  return {
    clientX,
    clientY,
  };
}

export function scrollElementIntoView(element) {
  element.scrollIntoView({
    inline: "center",
    behavior: "smooth",
  });
}

/**
 *
 * @param {chrome.runtime.Port} port
 * @param {object} data
 */
export function postPortMessage(port, data) {
  return new Promise((resolve) => {
    const id = uuid();

    /** Add Listener */
    port.onMessage?.addListener(
      createListener((listener, response) => {
        try {
          if (response.id === id) {
            port.onMessage?.removeListener(listener);
            resolve(response);
          }
        } catch (e) {
          console.error(e);
        }
      })
    );

    try {
      port?.postMessage({
        ...data,
        id,
      });
    } catch (e) {
      console.error(e);
    }
  });
}

/** Check if it's a Telegram Link */
export function isTelegramLink(link) {
  return link && /^(http|https):\/\/t\.me\/.+/i.test(link);
}

/** Check if it's a bot URL */
export function isBotURL(url) {
  return url && /_*bot|startapp=|start=/i.test(url);
}

/** Can Join Telegram Link */
export function canJoinTelegramLink(link) {
  return link && /^(http|https):\/\/t\.me\/[^\/\?]+$/i.test(link);
}

/** Fetch Content */
export function fetchContent(url, ...options) {
  return axios.get(url, ...options).then((res) => res.data);
}

/** Find Drop Main Script */
export async function findDropMainScript(url, name = "index") {
  const htmlResponse = await fetchContent(url);

  const parser = new DOMParser();
  const html = parser.parseFromString(htmlResponse, "text/html");

  const scripts = html.querySelectorAll("script");

  const indexScript = Array.prototype.find.call(
    scripts,
    (script) => script.type === "module" && script.src.includes(name)
  );

  return indexScript;
}

/** Get Main Script */
export async function getDropMainScript(url, name = "index") {
  const indexScript = await findDropMainScript(url, name);

  if (!indexScript) return;

  const scriptUrl = new URL(indexScript.getAttribute("src"), url);
  const scriptResponse = await fetchContent(scriptUrl);

  return scriptResponse;
}

/** Watch Window State Update */
export function watchWindowStateUpdate(windowId, currentState, updatedState) {
  return new Promise((res) => {
    const handleOnBoundsChanged = async (window) => {
      if (window.id === windowId) {
        const isCurrentState = window.state === currentState;
        const isUpdatedState =
          typeof updatedState === "undefined" ||
          (await chrome.windows.get(windowId)).state === updatedState;

        const isUpdated = isCurrentState && isUpdatedState;

        if (isUpdated) {
          chrome.windows.onBoundsChanged.removeListener(handleOnBoundsChanged);
          res();
        }
      }
    };

    chrome.windows.onBoundsChanged.addListener(handleOnBoundsChanged);
  });
}

/** Watch Window Removal */
export function watchWindowRemoval(windowId) {
  return new Promise((res) => {
    const handleOnRemoved = (id) => {
      if (id === windowId) {
        chrome.windows.onRemoved.removeListener(handleOnRemoved);
        res();
      }
    };

    chrome.windows.onRemoved.addListener(handleOnRemoved);
  });
}

/** Close Window */
export async function closeWindow(windowId) {
  const successfulRemoval = watchWindowRemoval(windowId);

  await chrome.windows.remove(windowId);
  await successfulRemoval;
}

/** Resize Farmer Window */
export async function resizeFarmerWindow() {
  const coords = await getWindowCoords();
  const currentWindow = await chrome?.windows?.getCurrent();

  await chrome?.windows?.update(currentWindow.id, {
    ...coords,
    state: "normal",
  });
}

/** Get Window Coords */
export async function getWindowCoords() {
  const sharedSettings = await getSharedSettings();
  const displays = await chrome.system.display.getInfo();
  const primaryDisplay =
    displays.find((display) => display.isPrimary) || displays[0];

  const maxWidth = primaryDisplay.workArea.width;
  const maxHeight = primaryDisplay.workArea.height;

  const position =
    sharedSettings.farmerPosition || defaultSharedSettings.farmerPosition;
  const width = Math.max(
    270,
    Math.floor(
      maxWidth /
        (sharedSettings.farmersPerWindow ||
          defaultSharedSettings.farmersPerWindow)
    )
  );
  const left = Math.max(1, Math.floor(position * width) - width);

  return {
    top: 0,
    left,
    width,
    height: maxHeight,
  };
}

/** Check Task Word */
export function taskWordIsValid(word, list) {
  return list.every((item) => word.toUpperCase().includes(item) === false);
}

/** Parse Telegram Link */
export function parseTelegramLink(url) {
  const parsedUrl = new URL(url);
  const [entity, shortName = ""] = parsedUrl.pathname
    .replace(/^\//, "")
    .split("/");

  return {
    url,
    entity,
    shortName,
    startParam:
      parsedUrl.searchParams.get("start") ||
      parsedUrl.searchParams.get("startapp") ||
      "",
  };
}

/** Extract Telegram WebAppData */
export function extractTgWebAppData(url) {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
  const initData = params.get("tgWebAppData");
  const initDataUnsafe = extractInitDataUnsafe(initData);

  return {
    platform: params.get("tgWebAppPlatform"),
    version: params.get("tgWebAppVersion"),
    initData,
    initDataUnsafe,
  };
}

/** Extract InitDataUnsafe */
export function extractInitDataUnsafe(initData) {
  const params = new URLSearchParams(initData);
  const data = {};

  for (const [key, value] of params.entries()) {
    try {
      data[key] = JSON.parse(value);
    } catch {
      data[key] = value;
    }
  }

  return data;
}

export function matchesAccountSearch(search, account) {
  return (
    account.user?.["username"]
      ?.toString()
      ?.replaceAll("@", "")
      ?.toLowerCase()
      ?.includes(search.replaceAll("@", "").toLowerCase()) ||
    account.title?.toLowerCase()?.includes(search.toLowerCase()) ||
    account.id.toString().includes(search)
  );
}

/** With Value */
export function withValue(value, callback) {
  return callback ? callback(value) : (callback) => callback(value);
}

/** Tap Value */
export function tapValue(value, callback) {
  if (callback) {
    callback(value);
  }
  return callback
    ? value
    : (callback) => {
        callback(value);
        return value;
      };
}

/**
 * Check if request is unauthenticated
 * @param {import("axios").AxiosError} error
 * @returns {boolean}
 */
export function requestIsUnauthorized(error) {
  return (
    error.config.ignoreUnauthorizedError !== true &&
    [401, 403, 418].includes(error?.response?.status)
  );
}
/** Send Webview Message */
export const sendWebviewMessage = (data) =>
  window.electron.ipcRenderer.sendToHost("webview-message", data);
