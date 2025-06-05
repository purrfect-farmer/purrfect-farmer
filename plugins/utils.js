"use strict";

const fp = require("fastify-plugin");
const nacl = require("tweetnacl");
const base64url = require("base64url");

const crypto = require("crypto");
const FARMER_BOT_TOKEN = process.env.FARMER_BOT_TOKEN || "";
const FARMER_BOT_ID = process.env.FARMER_BOT_ID || "7592929753";
const TELEGRAM_PUBLIC_KEY =
  "e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d";

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

module.exports = fp(async function (fastify, opts) {
  fastify.decorate("utils", {
    getInitDataUnsafe(initData) {
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
    },

    isValidInitData(initData) {
      const secret = crypto
        .createHmac("sha256", "WebAppData")
        .update(FARMER_BOT_TOKEN)
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
    },

    isValidEd25519InitData(initData) {
      const data = Object.fromEntries(new URLSearchParams(initData));

      const signature = base64url.toBuffer(data.signature);
      delete data.signature;
      delete data.hash;

      const prefix = `${FARMER_BOT_ID}:WebAppData\n`;

      const sortedKeys = Object.keys(data).sort();
      const check = sortedKeys.map((k) => `${k}=${data[k]}`).join("\n");

      const message = Buffer.from(prefix + check, "utf-8");
      const publicKey = Buffer.from(TELEGRAM_PUBLIC_KEY, "hex");

      const isValid = nacl.sign.detached.verify(message, signature, publicKey);
      return isValid;
    },
  });
});
