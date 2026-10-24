import AutoModule from "@purrfect/shared/lib/farmer/AutoModule.js";
import assert from "node:assert/strict";
import { test } from "node:test";

const STORED = { phrase: "alpha beta", address: "UQstored", version: 5 };

/** An Auto module whose connector and logger are recorded */
function createAuto({ connected = null, provider, result = { status: true } }) {
  const calls = [];
  const record =
    (name) =>
    (...args) =>
      calls.push([name, ...args]);

  const core = {
    autoWalletProvider: provider,
    logger: { success: record("success"), warn: record("warn") },
  };
  const ctx = {
    wallet: { getConnectedWalletAddress: () => connected },
    connector: {
      connect: async (wallet) => {
        calls.push(["connect", wallet]);
        return result;
      },
    },
  };

  return { auto: new AutoModule({ core, ctx }), calls };
}

test("a host without stored wallets does nothing", async () => {
  const { auto, calls } = createAuto({ provider: { getSources: () => [] } });

  await auto.connectStoredWallet();

  assert.deepEqual(calls, []);
});

test("a drop that already has a wallet keeps it", async () => {
  let asked = false;
  const { auto, calls } = createAuto({
    connected: "UQmine",
    provider: { getStoredWallet: async () => ((asked = true), STORED) },
  });

  await auto.connectStoredWallet();

  assert.equal(asked, false);
  assert.deepEqual(calls, []);
});

test("no stored wallet means no connect", async () => {
  const { auto, calls } = createAuto({
    provider: { getStoredWallet: async () => null },
  });

  await auto.connectStoredWallet();

  assert.deepEqual(calls, []);
});

test("the stored wallet is connected without a refresh", async () => {
  const { auto, calls } = createAuto({
    provider: { getStoredWallet: async () => STORED },
  });

  await auto.connectStoredWallet();

  assert.deepEqual(calls[0], ["connect", { ...STORED, refresh: false }]);
  assert.equal(calls[1][0], "success");
});

test("a refused connect is logged, not thrown", async () => {
  const { auto, calls } = createAuto({
    provider: { getStoredWallet: async () => STORED },
    result: { status: false, message: "Proof rejected" },
  });

  await auto.connectStoredWallet();

  assert.deepEqual(calls[1], [
    "warn",
    "Stored wallet not connected: Proof rejected",
  ]);
});
