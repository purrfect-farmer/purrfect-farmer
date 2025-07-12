import fs from "fs";
import { BrowserWindow, app } from "electron";
import { Conf } from "electron-conf/main";

import { BASE_URL, PRODUCTION_URL } from "../config";
const ALLOWED_URL_ORIGINS = [BASE_URL, PRODUCTION_URL].map(
  (url) => new URL(url).origin
);
export const IS_MAC_OS = process.platform === "darwin";
export const IS_WINDOWS = process.platform === "win32";
export const IS_LINUX = process.platform === "linux";
export const IS_PREVIEW = import.meta.env.VITE_TW_IS_PREVIEW === "true";
export const IS_FIRST_RUN = !fs.existsSync(
  `${app.getPath("userData")}/config.json`
);
export const IS_PRODUCTION = import.meta.env.VITE_TW_APP_ENV === "production";
export const windows = new Set();
export const store = new Conf();
export function getCurrentWindow() {
  return BrowserWindow.getFocusedWindow();
}
export function getLastWindow() {
  return Array.from(windows).pop();
}
export function hasExtraWindows() {
  return BrowserWindow.getAllWindows().length > 1;
}
export function reloadWindows(isAutoUpdateEnabled = true) {
  BrowserWindow.getAllWindows().forEach((window) => {
    const { hash } = new URL(window.webContents.getURL());
    if (isAutoUpdateEnabled) {
      window.loadURL(`${import.meta.env.VITE_TW_BASE_URL}${hash}`);
    } else {
      window.loadURL(`file://${__dirname}/index.html${hash}`);
    }
  });
}
export function focusLastWindow() {
  if (BrowserWindow.getAllWindows().every((window) => !window.isVisible())) {
    BrowserWindow.getAllWindows().forEach((window) => window.show());
  } else {
    getLastWindow()?.focus();
  }
}
export function getAppTitle(chatTitle) {
  const appName = app.getName();
  if (!chatTitle) {
    return appName;
  }
  return `${chatTitle} · ${appName}`;
}
export function checkIsWebContentsUrlAllowed(url) {
  if (!app.isPackaged) {
    return true;
  }
  const parsedUrl = new URL(url);
  const localContentsPathname = IS_WINDOWS
    ? encodeURI(`/${__dirname.replace(/\\/g, "/")}/index.html`)
    : encodeURI(`${__dirname}/index.html`);
  if (parsedUrl.pathname === localContentsPathname) {
    return true;
  }
  return ALLOWED_URL_ORIGINS.includes(parsedUrl.origin);
}
export const WINDOW_BUTTONS_POSITION = {
  standard: { x: 10, y: 20 },
  lowered: { x: 10, y: 52 },
};
export const forceQuit = {
  value: false,
  enable() {
    this.value = true;
  },
  disable() {
    this.value = false;
  },
  get isEnabled() {
    return this.value;
  },
};
