import app from "../config/app.js";
import base64url from "base64url";
import { createRequire } from "node:module";
import crypto from "crypto";
import { naturalCompare } from "@purrfect/shared/lib/naturalCompare.js";
import sharedUtils from "@purrfect/shared/utils/bundle.js";
import tweetnacl from "tweetnacl";

const require = createRequire(import.meta.url);

/** Telegram's key for third-party init data signatures */
const TELEGRAM_PUBLIC_KEY = Buffer.from(app.telegramPublicKey, "hex");

const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

const KEYCAP_EMOJIS = [
  "0️⃣",
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "🔟",
];

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function sha256Hmac(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

function md5(data) {
  return crypto.createHash("md5").update(data).digest("hex");
}

function isValidEd25519InitData(initData) {
  const data = Object.fromEntries(new URLSearchParams(initData));

  const signature = base64url.toBuffer(data.signature);
  delete data.signature;
  delete data.hash;

  const prefix = `${app.farmer.botId}:WebAppData\n`;

  const sortedKeys = Object.keys(data).sort();
  const check = sortedKeys.map((k) => `${k}=${data[k]}`).join("\n");

  const message = Buffer.from(prefix + check, "utf-8");

  return tweetnacl.sign.detached.verify(
    message,
    signature,
    TELEGRAM_PUBLIC_KEY,
  );
}

function truncateAndPad(input, width) {
  const str = String(input || "");
  if (str.length > width) {
    return str.slice(0, width - 1) + "…";
  }
  return str.padEnd(width);
}

function formatUsers(collection) {
  const totalUsers = collection.length;

  let list = collection.map((data) => {
    /** Username */
    let username = (data.username || data.id)
      .toString()
      .toLowerCase()
      .slice(0, 12);
    username = username.padEnd(15, "  ");

    /** Account Title */
    const title = app.displayAccountTitle
      ? (data.title || "").toUpperCase().slice(0, 8)
      : "";

    return { ...data, username, title };
  });

  /** Sort By Title or Username */
  const sortKey = app.displayAccountTitle ? "title" : "username";
  list.sort((a, b) => naturalCompare(a[sortKey], b[sortKey]));

  /** Retrieve Links */
  const links = list
    .map((data) => {
      const {
        id,
        status,
        session = "",
        username,
        title,
        info,
        url,
        count,
      } = data;
      const safeUsername = "@" + escapeHtml(username.trim());
      const titleHtml = title ? ` <b>${escapeHtml("(" + title + ")")}</b>` : "";

      const statusContent = `${status}${session}`;
      const linkHtml = url ? ` <b>[<a href="${url}">OPEN</a>]</b>` : "";

      const countHtml =
        typeof count !== "undefined" ? `<b>${KEYCAP_EMOJIS[count]}</b>` : "";

      let result = `${statusContent}${countHtml}${linkHtml}${titleHtml} <a href="tg://user?id=${id}">${safeUsername}</a>`;

      if (info) {
        result = `\n${result}\n${info}\n`;
      }

      return result;
    })
    .join("\n");

  return `\n<blockquote><b>👤 Users</b>: ${totalUsers}\n${links}</blockquote>\n`;
}

/** Utility to escape HTML entities */
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (m) => HTML_ENTITIES[m]);
}

/** Parse HTML into a document, loading jsdom only when first needed */
function parseHTML(html) {
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM(html);
  const { document } = dom.window;
  return document;
}

export default {
  ...sharedUtils,
  md5,
  sha256,
  sha256Hmac,
  isValidEd25519InitData,
  truncateAndPad,
  formatUsers,
  escapeHtml,
  parseHTML,
};
