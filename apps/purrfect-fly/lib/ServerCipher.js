import "../config/env.js";

import Encrypter from "@purrfect/shared/lib/Encrypter.js";

/** Thrown when the server has no encryption key, so nothing can be encrypted or decrypted */
export class EncryptionKeyMissingError extends Error {
  constructor() {
    super("Server encryption key is not set");
    this.name = "EncryptionKeyMissingError";
  }
}

/** The shared Encrypter keyed by a 64-hex-character server key */
export class ServerCipher {
  /** @param {string} [hexKey] 64 hex characters, anything else leaves the cipher unavailable */
  constructor(hexKey) {
    const text = String(hexKey || "").trim();

    this.key = /^[0-9a-fA-F]{64}$/.test(text)
      ? Uint8Array.from(Buffer.from(text, "hex"))
      : null;
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
  async encrypt(text) {
    this.assertAvailable();

    return Encrypter.encryptWithKey({ data: String(text), key: this.key });
  }

  /** Decrypt a base64 payload back into text, throwing when it was tampered with */
  async decrypt(payload) {
    this.assertAvailable();

    return Encrypter.decryptWithKey({ encrypted: payload, key: this.key });
  }
}

/** The server's cipher, keyed by ENCRYPTION_KEY */
const serverCipher = new ServerCipher(process.env.ENCRYPTION_KEY);

export default serverCipher;
