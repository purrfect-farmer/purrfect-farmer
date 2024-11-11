import axios from "axios";
import defaultSettings from "@/defaultSettings";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function uuid() {
  return uuidv4();
}

export function logNicely(...args) {
  console.log("==== FARMER LOGGING ====");
  args.forEach((item, index) => {
    console.log(index === 0 ? `<<<<${item}>>>>` : item);
  });
  console.log("==== FARMER ENDED ====");
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

export function delayForSeconds(length, precised = false) {
  return delay(length * 1000, precised);
}

export function delayForMinutes(length, precised = false) {
  return delay(length * 60 * 1000, precised);
}

export async function getStorage(key, defaultValue) {
  const { [key]: value } = await chrome?.storage?.local.get(key);
  return value || defaultValue;
}

export async function getSettings() {
  return {
    ...defaultSettings,
    ...(await getStorage("settings", defaultSettings)),
  };
}

export function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);

  const isDisplayed = style.display !== "none";
  const isVisible = style.visibility !== "hidden";
  const hasOpacity = style.opacity !== "0";

  return isDisplayed && isVisible && hasOpacity;
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
          port.onMessage.removeListener(respond);
        }
        callback(response);
      }
    } catch {}
  };

  port.onMessage.addListener(respond);
  port.postMessage({
    ...message,
    id,
    once,
  });
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

export function fetchContent(url, ...options) {
  return axios.get(url, ...options).then((res) => res.data);
}

export async function getDropMainScript(url, name = "index") {
  const htmlResponse = await fetchContent(url);

  const parser = new DOMParser();
  const html = parser.parseFromString(htmlResponse, "text/html");

  const scripts = html.querySelectorAll("script");

  const indexScript = Array.prototype.find.call(
    scripts,
    (script) => script.type === "module" && script.src.includes(name)
  );

  if (!indexScript) return;

  const scriptUrl = new URL(indexScript.getAttribute("src"), url);
  const scriptResponse = await fetchContent(scriptUrl);

  return scriptResponse;
}

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
      300,
      Math.floor(
        currentWindow.width /
          (settings.farmersPerWindow || defaultSettings.farmersPerWindow)
      )
    );

    const left = Math.max(1, Math.floor(position * width) - width);

    chrome?.windows?.update(currentWindow.id, {
      state: "normal",
      width,
      left,
    });
  }
}

export async function maximizeFarmerWindow() {
  const currentWindow = await chrome?.windows?.getCurrent();

  if (currentWindow && currentWindow.type === "popup") {
    chrome?.windows?.update(currentWindow.id, {
      state: "maximized",
    });
  }
}
