import axios from "axios";
import defaultSettings from "@/default-settings";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function uuid() {
  return uuidv4();
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

export function getSettings() {
  return new Promise((res, rej) => {
    chrome?.storage?.local
      .get("settings")
      .then(({ settings = defaultSettings }) =>
        res({
          ...defaultSettings,
          ...settings,
        })
      )
      .catch(rej);
  });
}

export function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);

  const isDisplayed = style.display !== "none";
  const hasOpacity = style.opacity !== "0";
  const isVisible = style.visibility !== "hidden";

  return isDisplayed && hasOpacity && isVisible;
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
