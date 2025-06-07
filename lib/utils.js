const dateFns = require("date-fns");
const nacl = require("tweetnacl");
const base64url = require("base64url");

const crypto = require("crypto");
const { v4 } = require("uuid");
const app = require("../config/app");

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function md5(data) {
  return crypto.createHash("md5").update(data).digest("hex");
}

/** Parse Telegram Link */
function parseTelegramLink(url) {
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
function extractTgWebAppData(url) {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
  const initData = params.get("tgWebAppData");
  const initDataUnsafe = getInitDataUnsafe(initData);

  return {
    platform: params.get("tgWebAppPlatform"),
    version: params.get("tgWebAppVersion"),
    initData,
    initDataUnsafe,
  };
}

function getInitDataUnsafe(initData) {
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

function isValidInitData(initData) {
  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(app.farmerBotToken)
    .digest();

  const data = Object.fromEntries(new URLSearchParams(initData));
  const hash = data.hash;
  delete data.hash;

  const check = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("\n");

  const compare = crypto
    .createHmac("sha256", secret)
    .update(check)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(compare, "hex")
  );
}

function isValidEd25519InitData(initData) {
  const data = Object.fromEntries(new URLSearchParams(initData));

  const signature = base64url.toBuffer(data.signature);
  delete data.signature;
  delete data.hash;

  const prefix = `${app.farmerBotId}:WebAppData\n`;

  const sortedKeys = Object.keys(data).sort();
  const check = sortedKeys.map((k) => `${k}=${data[k]}`).join("\n");

  const message = Buffer.from(prefix + check, "utf-8");
  const publicKey = Buffer.from(app.telegramPublicKey, "hex");

  const isValid = nacl.sign.detached.verify(message, signature, publicKey);
  return isValid;
}

/** Check if it's a Telegram Link */
function isTelegramLink(link) {
  return link && /^(http|https):\/\/t\.me\/.+/i.test(link);
}

/** Check if it's a bot URL */
function isBotURL(url) {
  return url && /_*bot|startapp=|start=/i.test(url);
}

/** Can Join Telegram Link */
function canJoinTelegramLink(link) {
  return link && /^(http|https):\/\/t\.me\/[^\/\?]+$/i.test(link);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomPercent(value, min = 0, max = 100) {
  return Math.floor(
    (value * (min + Math.floor(Math.random() * (max - min)))) / 100
  );
}

function extraGamePoints(points) {
  return points + randomPercent(points, 0, 20);
}

function delay(length, precised = false) {
  return new Promise((res) => {
    setTimeout(
      () => res(),
      precised
        ? length
        : (length * (Math.floor(Math.random() * 50) + 100)) / 100
    );
  });
}

function delayForSeconds(length, precised = false) {
  return delay(length * 1000, precised);
}

function delayForMinutes(length, precised = false) {
  return delay(length * 60 * 1000, precised);
}

function uuid() {
  return v4();
}

function truncateAndPad(input, width) {
  const str = String(input ?? "");
  if (str.length > width) {
    return str.slice(0, width - 1) + "…";
  }
  return str.padEnd(width);
}

function formatUsers(collection) {
  const totalUsers = collection.length;

  let list = collection.map((data) => {
    const id = data.id;
    const status = data.status;
    const session = data.session;

    /** Username */
    let username = (data.username || id).toString().toLowerCase().slice(0, 12);
    username = username.padEnd(15, "  ");

    /** Account Title */
    const title = app.displayAccountTitle
      ? (data.title || "").toUpperCase().slice(0, 8)
      : "";

    return { id, status, session, username, title };
  });

  /** Sort By Title or Username */
  list.sort((a, b) => {
    const key = app.displayAccountTitle ? "title" : "username";
    return a[key].localeCompare(b[key]);
  });

  /** Retrieve Links */
  const links = list
    .map((data) => {
      const { id, status, session, username, title } = data;
      const safeUsername = "@" + escapeHtml(username.trim());
      const titleHtml = title ? ` <b>${escapeHtml("(" + title + ")")}</b>` : "";
      return `${status} ${session}${titleHtml} <a href="tg://user?id=${id}">${safeUsername}</a>`;
    })
    .join("\n");

  return `\n<blockquote><b>👤 Users</b>: ${totalUsers}\n${links}</blockquote>\n`;
}

/** Utility to escape HTML entities */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

const utils = {
  dateFns,
  md5,
  sha256,
  escapeHtml,
  formatUsers,
  truncateAndPad,
  uuid,
  delay,
  delayForSeconds,
  delayForMinutes,
  randomItem,
  randomPercent,
  extraGamePoints,
  parseTelegramLink,
  extractTgWebAppData,
  getInitDataUnsafe,
  isTelegramLink,
  isBotURL,
  canJoinTelegramLink,
  isValidInitData,
  isValidEd25519InitData,
};

module.exports = utils;
