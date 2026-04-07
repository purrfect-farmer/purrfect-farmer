import { gcm as aes256gcm } from "@noble/ciphers/webcrypto.js";
import { base64 } from "@scure/base";
import { randomBytes } from "@noble/ciphers/utils.js";
import { scryptAsync } from "@noble/hashes/scrypt.js";

export default class Encrypter {
  static VERSION = 1;
  static SALT_BYTES = 32;
  static NONCE_BYTES = 12;
  static KEY_BYTES = 32;

  static generateSalt() {
    return base64.encode(randomBytes(this.SALT_BYTES));
  }

  static async scryptPass(password, saltB64) {
    const salt = base64.decode(saltB64);
    return await scryptAsync(password, salt, {
      N: 2 ** 15,
      r: 8,
      p: 1,
      dkLen: this.KEY_BYTES,
    });
  }

  static async encryptData({ data, password, salt, nonce, encode = true }) {
    const saltB64 = salt || this.generateSalt();
    const iv = nonce || randomBytes(this.NONCE_BYTES);
    const key = await this.scryptPass(password, saltB64);
    const cipher = aes256gcm(key, iv);

    const dataBytes =
      typeof data === "string"
        ? new TextEncoder().encode(data)
        : data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : data;

    const encrypted = await cipher.encrypt(dataBytes);

    const bundle = new Uint8Array(1 + iv.length + encrypted.length);
    bundle.set([this.VERSION]);
    bundle.set(iv, 1);
    bundle.set(encrypted, 1 + iv.length);

    return {
      encrypted: encode ? base64.encode(bundle) : bundle,
      salt: saltB64,
    };
  }

  static async decryptData({ encrypted, password, salt, asText = true }) {
    const bundle =
      typeof encrypted === "string" ? base64.decode(encrypted) : encrypted;

    const version = bundle[0];
    if (version !== this.VERSION) throw new Error("Unsupported cipher version");

    const iv = bundle.slice(1, 1 + this.NONCE_BYTES);
    const cipherText = bundle.slice(1 + this.NONCE_BYTES);

    const key = await this.scryptPass(password, salt);
    const cipher = aes256gcm(key, iv);

    const decrypted = await cipher.decrypt(cipherText);

    if (!decrypted) throw new Error("Invalid password or corrupted data");

    return asText ? new TextDecoder().decode(decrypted) : decrypted;
  }
}
