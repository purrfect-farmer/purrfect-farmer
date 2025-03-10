import axios from "axios";
import defaultSettings from "@/core/defaultSettings";
import userAgents from "@/core/userAgents";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function uuid() {
  return uuidv4();
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
    setTimeout(
      () => res(),
      precised
        ? length
        : (length * (Math.floor(Math.random() * 50) + 100)) / 100
    );
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

export async function getStorage(key, defaultValue) {
  const data = await chrome?.storage?.local.get(key);
  const value = data?.[key];
  return typeof value !== "undefined" ? value : defaultValue;
}

export async function getSettings() {
  const settings = await getStorage("settings", defaultSettings);

  return {
    ...defaultSettings,
    ...settings,
  };
}

export async function getUserAgent() {
  return await getStorage(
    "userAgent",
    userAgents[Math.floor(Math.random() * userAgents.length)]
  );
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
 * @param {object} message
 * @returns
 */
export function connectPortMessage(port, message, callback, once = true) {
  const id = uuid();
  const respond = (response) => {
    try {
      if (response.id === id) {
        if (once) {
          port.onMessage?.removeListener(respond);
        }
        callback(response);
      }
    } catch {}
  };

  /** Add Listener */
  port.onMessage?.addListener(respond);

  try {
    port?.postMessage({
      ...message,
      id,
      once,
    });
  } catch {}
}

/**
 *
 * @param {chrome.runtime.Port} port
 * @param {object} data
 */
export function postPortMessage(port, data) {
  return new Promise((resolve) => {
    connectPortMessage(port, data, resolve);
  });
}

/** Check if it's a Telegram Link */
export function isTelegramLink(link) {
  return link && /^(http|https):\/\/t\.me\/.+/i.test(link.toLowerCase());
}

/** Check if it's a bot URL */
export function isBotURL(url) {
  return url && /_bot|startapp=|start=/i.test(url.toLowerCase());
}

/** Can Join Telegram Link */
export function canJoinTelegramLink(link) {
  return (
    link &&
    link.toLowerCase().includes("bot") === false &&
    /^(http|https):\/\/t\.me\/[^\/\?]+$/i.test(link.toLowerCase())
  );
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
  const currentWindow = await chrome?.windows?.getCurrent();

  if (
    currentWindow &&
    currentWindow.type === "popup" &&
    currentWindow.state === "maximized"
  ) {
    const settings = await getSettings();
    const position = settings.farmerPosition || defaultSettings.farmerPosition;
    const width = Math.max(
      270,
      Math.floor(
        currentWindow.width /
          (settings.farmersPerWindow || defaultSettings.farmersPerWindow)
      )
    );

    const left = Math.max(1, Math.floor(position * width) - width);

    await chrome?.windows?.update(currentWindow.id, {
      state: "normal",
      width,
      left,
    });
  }
}

/** Maximize Farmer Window */
export async function maximizeFarmerWindow() {
  const currentWindow = await chrome?.windows?.getCurrent();

  if (currentWindow && currentWindow.type === "popup") {
    await chrome?.windows?.update(currentWindow.id, {
      state: "maximized",
    });
  }
}

/** Check Task Word */
export function taskWordIsValid(word, list) {
  return list.every((item) => word.toUpperCase().includes(item) === false);
}
