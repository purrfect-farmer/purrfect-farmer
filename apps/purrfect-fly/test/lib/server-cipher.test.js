import {
  EncryptionKeyMissingError,
  ServerCipher,
} from "../../lib/ServerCipher.js";

import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";

const createKey = () => crypto.randomBytes(32).toString("hex");

test("a payload decrypts back to the original text", () => {
  const cipher = new ServerCipher(createKey());
  const payload = cipher.encrypt("alpha beta gamma");

  assert.notEqual(payload, "alpha beta gamma");
  assert.equal(cipher.decrypt(payload), "alpha beta gamma");
});

test("a tampered payload is refused", () => {
  const cipher = new ServerCipher(createKey());
  const bundle = Buffer.from(cipher.encrypt("alpha"), "base64");

  bundle[bundle.length - 1] ^= 1;

  assert.throws(() => cipher.decrypt(bundle.toString("base64")));
});

test("another key cannot decrypt the payload", () => {
  const payload = new ServerCipher(createKey()).encrypt("alpha");

  assert.throws(() => new ServerCipher(createKey()).decrypt(payload));
});

test("a missing or malformed key leaves the cipher unavailable", () => {
  for (const key of [undefined, "", "abc", "z".repeat(64)]) {
    const cipher = new ServerCipher(key);

    assert.equal(cipher.isAvailable(), false);
    assert.throws(() => cipher.encrypt("alpha"), EncryptionKeyMissingError);
    assert.throws(() => cipher.decrypt("AQ=="), EncryptionKeyMissingError);
  }
});
