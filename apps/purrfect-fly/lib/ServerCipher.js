import "../config/env.js";

import crypto from "node:crypto";

/** Thrown when the server has no encryption key, so nothing can be encrypted or decrypted */
export class EncryptionKeyMissingError extends Error {
  constructor() {
    super("Server encryption key is not set");
    this.name = "EncryptionKeyMissingError";
  }
}

/** AES-256-GCM under a 32-byte hex key, payloads are base64 of version | iv | tag | ciphertext */
export class ServerCipher {
  static VERSION = 1;
  static IV_BYTES = 12;
  static TAG_BYTES = 16;
  static ALGORITHM = "aes-256-gcm";

  /** @param {string} [hexKey] 64 hex characters, anything else leaves the cipher unavailable */
  constructor(hexKey) {
    const text = String(hexKey || "").trim();

    this.key = /^[0-9a-fA-F]{64}$/.test(text) ? Buffer.from(text, "hex") : null;
  }

  isAvailable() {
    return this.key !== null;
  }

  assertAvailable() {
    if (!this.isAvailable()) {
      throw new EncryptionKeyMissingError();
    }
  }

  /** Encrypt text into a base64 payload */
  encrypt(text) {
    this.assertAvailable();

    const { VERSION, IV_BYTES, ALGORITHM } = ServerCipher;
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    const cipherText = Buffer.concat([
      cipher.update(String(text), "utf8"),
      cipher.final(),
    ]);

    return Buffer.concat([
      Buffer.from([VERSION]),
      iv,
      cipher.getAuthTag(),
      cipherText,
    ]).toString("base64");
  }

  /** Decrypt a base64 payload back into text, throwing when it was tampered with */
  decrypt(payload) {
    this.assertAvailable();

    const { VERSION, IV_BYTES, TAG_BYTES, ALGORITHM } = ServerCipher;
    const bundle = Buffer.from(String(payload), "base64");

    if (bundle[0] !== VERSION) {
      throw new Error("Unsupported cipher version");
    }

    const tagStart = 1 + IV_BYTES;
    const textStart = tagStart + TAG_BYTES;
    const iv = bundle.subarray(1, tagStart);
    const tag = bundle.subarray(tagStart, textStart);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);

    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(bundle.subarray(textStart)),
      decipher.final(),
    ]).toString("utf8");
  }
}

/** The server's cipher, keyed by ENCRYPTION_KEY */
const serverCipher = new ServerCipher(process.env.ENCRYPTION_KEY);

export default serverCipher;
