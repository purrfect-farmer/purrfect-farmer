import {
  EncryptionKeyMissingError,
  ServerCipher,
} from "../../lib/ServerCipher.js";

import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";

const createKey = () => crypto.randomBytes(32).toString("hex");

test("a payload decrypts back to the original text", async () => {
  const cipher = new ServerCipher(createKey());
  const payload = await cipher.encrypt("alpha beta gamma");

  assert.notEqual(payload, "alpha beta gamma");
  assert.equal(await cipher.decrypt(payload), "alpha beta gamma");
});

test("a tampered payload is refused", async () => {
  const cipher = new ServerCipher(createKey());
  const bundle = Buffer.from(await cipher.encrypt("alpha"), "base64");

  bundle[bundle.length - 1] ^= 1;

  await assert.rejects(cipher.decrypt(bundle.toString("base64")));
});

test("another key cannot decrypt the payload", async () => {
  const payload = await new ServerCipher(createKey()).encrypt("alpha");

  await assert.rejects(new ServerCipher(createKey()).decrypt(payload));
});

test("a missing or malformed key leaves the cipher unavailable", async () => {
  for (const key of [undefined, "", "abc", "z".repeat(64)]) {
    const cipher = new ServerCipher(key);

    assert.equal(cipher.isAvailable(), false);
    await assert.rejects(cipher.encrypt("alpha"), EncryptionKeyMissingError);
    await assert.rejects(cipher.decrypt("AQ=="), EncryptionKeyMissingError);
  }
});
