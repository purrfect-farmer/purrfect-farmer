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

test("a host without account wallets has nothing to connect", () => {
  const { auto } = createAuto({ provider: { getSources: () => [] } });

  assert.equal(auto.canConnectAccountWallet(), false);
});

test("a drop that already has a wallet keeps it", () => {
  const { auto } = createAuto({
    connected: "UQmine",
    provider: { getAccountWallet: async () => STORED },
  });

  assert.equal(auto.canConnectAccountWallet(), false);
});

test("a drop without a wallet can take the account one", () => {
  const { auto } = createAuto({
    provider: { getAccountWallet: async () => STORED },
  });

  assert.equal(auto.canConnectAccountWallet(), true);
});

test("no account wallet means no connect", async () => {
  const { auto, calls } = createAuto({
    provider: { getAccountWallet: async () => null },
  });

  await auto.connectAccountWallet();

  assert.deepEqual(calls, []);
});

test("the account wallet is connected without a refresh", async () => {
  const { auto, calls } = createAuto({
    provider: { getAccountWallet: async () => STORED },
  });

  await auto.connectAccountWallet();

  assert.deepEqual(calls[0], ["connect", { ...STORED, refresh: false }]);
  assert.equal(calls[1][0], "success");
});

test("a refused connect is logged, not thrown", async () => {
  const { auto, calls } = createAuto({
    provider: { getAccountWallet: async () => STORED },
    result: { status: false, message: "Proof rejected" },
  });

  await auto.connectAccountWallet();

  assert.deepEqual(calls[1], [
    "warn",
    "Account wallet not connected: Proof rejected",
  ]);
});

test("an account wallet that fails to load is logged, not thrown", async () => {
  const { auto, calls } = createAuto({
    provider: {
      getAccountWallet: async () => {
        throw new Error("Unsupported cipher version");
      },
    },
  });

  await auto.connectAccountWallet();

  assert.deepEqual(calls, [
    ["warn", "Account wallet not connected: Unsupported cipher version"],
  ]);
});
