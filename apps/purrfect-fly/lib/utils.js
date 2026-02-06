import { JSDOM } from "jsdom";
import app from "../config/app.js";
import base64url from "base64url";
import crypto from "crypto";
import sharedUtils from "@purrfect/shared/utils/bundle.js";
import tweetnacl from "tweetnacl";

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function sha256Hmac(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

function md5(data) {
  return crypto.createHash("md5").update(data).digest("hex");
}

function isValidInitData(initData) {
  const secret = crypto
    .createHmac("sha256", "WebAppData")
    .update(app.farmer.botToken)
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
    Buffer.from(compare, "hex"),
  );
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
  const publicKey = Buffer.from(app.telegramPublicKey, "hex");

  const isValid = tweetnacl.sign.detached.verify(message, signature, publicKey);
  return isValid;
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
  list.sort((a, b) => {
    const key = app.displayAccountTitle ? "title" : "username";
    return a[key].localeCompare(b[key]);
  });

  /** Retrieve Links */
  const links = list
    .map((data) => {
      const { id, status, session, username, title, info, url } = data;
      const safeUsername = "@" + escapeHtml(username.trim());
      const titleHtml = title ? ` <b>${escapeHtml("(" + title + ")")}</b>` : "";

      const statusContent = `${status} ${session}`;
      const statusHtml = url
        ? `<a href="${url}">${statusContent}</a>`
        : statusContent;

      let result = `${statusHtml}${titleHtml} <a href="tg://user?id=${id}">${safeUsername}</a>`;

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
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function parseHTML(html) {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  return document;
}

export default {
  ...sharedUtils,
  md5,
  sha256,
  sha256Hmac,
  isValidInitData,
  isValidEd25519InitData,
  truncateAndPad,
  formatUsers,
  escapeHtml,
  parseHTML,
};
