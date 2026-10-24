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

  /** Bytes of text, an ArrayBuffer or a byte array */
  static toBytes(data) {
    return typeof data === "string"
      ? new TextEncoder().encode(data)
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : data;
  }

  /** Encrypt under a ready key into a version | iv | ciphertext bundle */
  static async seal(key, data, nonce) {
    const iv = nonce || randomBytes(this.NONCE_BYTES);
    const encrypted = await aes256gcm(key, iv).encrypt(this.toBytes(data));

    const bundle = new Uint8Array(1 + iv.length + encrypted.length);
    bundle.set([this.VERSION]);
    bundle.set(iv, 1);
    bundle.set(encrypted, 1 + iv.length);

    return bundle;
  }

  /** Decrypt a version | iv | ciphertext bundle under a ready key */
  static async open(key, encrypted, asText) {
    const bundle =
      typeof encrypted === "string" ? base64.decode(encrypted) : encrypted;

    const version = bundle[0];
    if (version !== this.VERSION) throw new Error("Unsupported cipher version");

    const iv = bundle.slice(1, 1 + this.NONCE_BYTES);
    const cipherText = bundle.slice(1 + this.NONCE_BYTES);

    const decrypted = await aes256gcm(key, iv).decrypt(cipherText);

    if (!decrypted) throw new Error("Invalid password or corrupted data");

    return asText ? new TextDecoder().decode(decrypted) : decrypted;
  }

  static async encryptData({ data, password, salt, nonce, encode = true }) {
    const saltB64 = salt || this.generateSalt();
    const key = await this.scryptPass(password, saltB64);
    const bundle = await this.seal(key, data, nonce);

    return {
      encrypted: encode ? base64.encode(bundle) : bundle,
      salt: saltB64,
    };
  }

  static async decryptData({ encrypted, password, salt, asText = true }) {
    const key = await this.scryptPass(password, salt);

    return this.open(key, encrypted, asText);
  }

  /** Encrypt under a random 32-byte key, skipping scrypt since there is no password to stretch */
  static async encryptWithKey({ data, key, nonce, encode = true }) {
    const bundle = await this.seal(key, data, nonce);

    return encode ? base64.encode(bundle) : bundle;
  }

  /** Decrypt what encryptWithKey produced */
  static async decryptWithKey({ encrypted, key, asText = true }) {
    return this.open(key, encrypted, asText);
  }
}
