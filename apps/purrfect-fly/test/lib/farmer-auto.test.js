import AutoSnapshot from "@purrfect/shared/lib/farmer/AutoSnapshot.js";
import AutoWalletConnector from "@purrfect/shared/lib/farmer/AutoWalletConnector.js";
import Decimal from "decimal.js";
import WalletVersion from "@purrfect/shared/lib/farmer/WalletVersion.js";
import WithdrawalFlow from "@purrfect/shared/lib/farmer/WithdrawalFlow.js";
import assert from "node:assert/strict";
import { test } from "node:test";

/** A core whose logger, prompts, storage and admin notices are recorded */
function createCore({ scheduled = false, answers = [], auto = {} } = {}) {
  const calls = [];
  const record =
    (name) =>
    (...args) =>
      calls.push([name, ...args]);
  const store = new Map();

  const core = {
    drop: { auto: { token: "TKN", minWithdrawal: 10, ...auto } },
    logger: {
      info: record("info"),
      warn: record("warn"),
      error: record("error"),
    },
    storage: {
      get: async (key) => store.get(key),
      set: async (key, value) => {
        calls.push(["set", key, value]);
        store.set(key, value);
      },
    },
    scheduled,
    userId: () => 42,
    prompt: async (question) => {
      calls.push(["prompt", question]);
      return answers.shift();
    },
    notifyAdmin: record("notifyAdmin"),
  };

  return { core, calls };
}

test("an unforced withdrawal skips quietly without placing", async () => {
  const { core, calls } = createCore();
  const flow = new WithdrawalFlow({
    core,
    place: async () => calls.push(["place"]),
  });

  assert.deepEqual(await flow.withdraw(), {
    status: false,
    skipped: true,
    message: "Withdrawal is disabled unless requested!",
    amount: "0",
  });
  assert.deepEqual(calls, []);
});

test("the interactive withdrawal logs the status, then places the typed amount", async () => {
  const { core, calls } = createCore({ answers: ["25"] });
  const flow = new WithdrawalFlow({
    core,
    place: async (options) => calls.push(["place", options]),
    logStatus: async () => calls.push(["status"]),
  });

  await flow.withdrawInteractive();

  assert.deepEqual(calls, [
    ["status"],
    ["prompt", "How much TKN? (minimum 10)"],
    ["place", { max: 25, difference: 0 }],
  ]);
});

test("the live minimum wins over the declared one", () => {
  const { core } = createCore();
  const flow = new WithdrawalFlow({ core, place: null, minimum: () => 99 });

  assert.equal(flow.declaredMinimum(), 10);
  assert.equal(flow.minimum(), 99);
});

test("a picked amount stays between the minimum and the balance", () => {
  const { core } = createCore();
  const flow = new WithdrawalFlow({ core, place: null });

  for (let i = 0; i < 50; i++) {
    const amount = flow.pickAmount({
      balance: 100,
      minimum: 50,
      max: 80,
      difference: 20,
    });

    assert.ok(amount.gte(50) && amount.lte(80), amount.toString());
    assert.ok(amount.isInteger());
  }

  assert.equal(flow.pickAmount({ balance: 30, minimum: 50 }).toString(), "30");
});

test("a low balance is a skip, and enough balance is logged", () => {
  const { core, calls } = createCore();
  const flow = new WithdrawalFlow({ core, place: null });

  assert.equal(flow.skipLowBalance(new Decimal(5), 10).skipped, true);
  assert.equal(flow.skipLowBalance(new Decimal(15), 10), null);
  assert.deepEqual(calls, [
    ["error", "Not enough balance:", "5"],
    ["info", "Available balance:", "15"],
  ]);
});

test("the admin hears of a withdrawal only on a scheduled run", async () => {
  const manual = createCore();
  await new WithdrawalFlow({ core: manual.core }).notify([["Requested", "5"]]);
  assert.deepEqual(manual.calls, []);

  const scheduled = createCore({ scheduled: true });
  await new WithdrawalFlow({ core: scheduled.core }).notify([
    ["Requested", "5"],
  ]);
  assert.deepEqual(scheduled.calls, [
    [
      "notifyAdmin",
      [
        "<b>🤑 TKN Withdrawal</b>",
        '<b>Account</b>: <a href="tg://user?id=42">42</a>',
        "<b>Requested</b>: 5",
      ],
    ],
  ]);
});

test("the snapshot trims each queue and counts approvals and pending", async () => {
  const { core, calls } = createCore();
  const snapshot = new AutoSnapshot({
    core,
    summary: () => ({ level: 3 }),
    withdrawals: async () => ({
      pending: [1, 2, 3],
      approved: [1, 2, 3, 4],
      flagged: [1],
    }),
  });

  const stored = await snapshot.store();

  assert.equal(stored.level, 3);
  assert.deepEqual(
    { ...stored.withdrawal, checkedAt: 0 },
    {
      pending: [1, 2],
      pendingCount: 3,
      approved: 4,
      flagged: [1],
      checkedAt: 0,
    },
  );
  assert.deepEqual(calls[0].slice(0, 2), ["set", "autoSnapshot"]);
});

test("an unreadable queue leaves the snapshot without one", async () => {
  const { core } = createCore();
  const snapshot = new AutoSnapshot({
    core,
    summary: () => ({}),
    withdrawals: async () => {
      throw new Error("down");
    },
  });

  assert.equal(await snapshot.readWithdrawals(), null);
});

/** A connector whose every step is recorded */
function createConnector({ signed = true, status = true } = {}) {
  const calls = [];
  const connector = new AutoWalletConnector({
    connectAddress: async (address) => {
      calls.push(["address", address]);
      return { status, message: "address refused" };
    },
    connectSigned: signed
      ? async (keyPair, version) => {
          calls.push(["signed", typeof keyPair.secretKey, version]);
          return { status, message: "signed refused" };
        }
      : null,
    rememberVersion: async (version) => calls.push(["remember", version]),
    summary: () => ({ fresh: false }),
    refreshSummary: async () => ({ fresh: true }),
    ensureLoaded: async () => calls.push(["ensure"]),
  });

  return { connector, calls };
}

const PHRASE =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";

test("an address is bound, then its version remembered", async () => {
  const { connector, calls } = createConnector();

  assert.deepEqual(
    await connector.connect({ address: "EQ-address", version: 4 }),
    { status: true, summary: { fresh: false } },
  );
  assert.deepEqual(calls, [
    ["ensure"],
    ["address", "EQ-address"],
    ["remember", 4],
  ]);
});

test("a phrase signs when the drop can, and the summary is refreshed on request", async () => {
  const { connector, calls } = createConnector();

  assert.deepEqual(
    await connector.connect({ phrase: PHRASE, version: 5, refresh: true }),
    { status: true, summary: { fresh: true } },
  );
  assert.deepEqual(calls, [
    ["ensure"],
    ["signed", "object", 5],
    ["remember", 5],
  ]);
});

test("a refused bind remembers nothing", async () => {
  const { connector, calls } = createConnector({
    signed: false,
    status: false,
  });

  assert.deepEqual(
    await connector.connect({ address: "EQ-address", version: 4 }),
    { status: false, message: "address refused" },
  );
  assert.deepEqual(calls, [["ensure"], ["address", "EQ-address"]]);
});

test("the wallet version is kept as vN and forgotten when empty", async () => {
  const { core, calls } = createCore();
  const walletVersion = new WalletVersion(() => core.storage);

  await walletVersion.remember(5);
  assert.equal(walletVersion.current, "v5");

  await walletVersion.remember(undefined);
  assert.equal(walletVersion.current, undefined);

  await core.storage.set("walletVersion", "v4");
  await walletVersion.load();
  assert.equal(walletVersion.current, "v4");
  assert.deepEqual(calls.slice(0, 2), [
    ["set", "walletVersion", "v5"],
    ["set", "walletVersion", undefined],
  ]);
});
