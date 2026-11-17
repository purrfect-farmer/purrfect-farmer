import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deriveMnemonicFromTelegramId,
  deriveWalletFromTelegramId,
  getWalletAddressFromMnemonic,
} from "@purrfect/shared/lib/ton/wallet.js";

const ID = "123456789";
const PASSPHRASE = "example";

test("the derived wallet matches the deriver's phrase and W5 address", async () => {
  /* Derive the same wallet both ways */
  const words = await deriveMnemonicFromTelegramId(ID, PASSPHRASE);
  const wallet = await deriveWalletFromTelegramId(ID, PASSPHRASE);

  /* Compare phrase, address and version */
  assert.equal(wallet.phrase, words.join(" "));
  assert.equal(wallet.address, await getWalletAddressFromMnemonic(words, 5));
  assert.equal(wallet.version, 5);
});

test("a numeric ID derives the same wallet as its string", async () => {
  const fromNumber = await deriveWalletFromTelegramId(Number(ID), PASSPHRASE);
  const fromString = await deriveWalletFromTelegramId(ID, PASSPHRASE);

  assert.deepEqual(fromNumber, fromString);
});

test("version 4 derives the V4 address", async () => {
  const words = await deriveMnemonicFromTelegramId(ID, PASSPHRASE);
  const wallet = await deriveWalletFromTelegramId(ID, PASSPHRASE, 4);

  assert.equal(wallet.address, await getWalletAddressFromMnemonic(words, 4));
  assert.equal(wallet.version, 4);
});

test("no passphrase derives nothing", async () => {
  assert.equal(await deriveWalletFromTelegramId(ID, ""), null);
  assert.equal(await deriveWalletFromTelegramId(ID, undefined), null);
});

test("a missing or non-numeric ID derives nothing", async () => {
  assert.equal(await deriveWalletFromTelegramId(null, PASSPHRASE), null);
  assert.equal(await deriveWalletFromTelegramId("", PASSPHRASE), null);
  assert.equal(await deriveWalletFromTelegramId("user1", PASSPHRASE), null);
});
