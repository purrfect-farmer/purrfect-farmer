import assert from "node:assert/strict";
import { test } from "node:test";
import selectAccounts, {
  assignUnusedProxies,
} from "../../farmers/runner/selectAccounts.js";

const base = {
  terminated: new Set(),
  primaryAccountId: 1,
  platform: "telegram",
  autoStart: true,
  referrerMode: "single",
  primaryLinkResolved: false,
};

const active = (id, extra = {}) => ({
  id,
  farmingEnabled: true,
  farmer: { status: "active" },
  ...extra,
});
const fresh = (id, extra = {}) => ({
  id,
  farmingEnabled: true,
  farmer: null,
  session: "s",
  ...extra,
});

const ids = (list) => list.map((item) => item.id);

test("new accounts wait for the primary link in single mode", () => {
  const { executable } = selectAccounts({
    ...base,
    accounts: [active(1), fresh(2)],
  });

  assert.deepEqual(ids(executable), [1]);
});

test("new accounts auto-start once the primary link resolves", () => {
  const { executable } = selectAccounts({
    ...base,
    primaryLinkResolved: true,
    accounts: [active(1), fresh(2)],
  });

  assert.deepEqual(ids(executable), [1, 2]);
});

test("a fresh primary account may auto-start to resolve its link", () => {
  const { executable, primaryAccount } = selectAccounts({
    ...base,
    accounts: [fresh(1), fresh(2)],
  });

  assert.equal(primaryAccount.id, 1);
  assert.deepEqual(ids(executable), [1]);
});

test("frozen, banned, terminated and disabled accounts are skipped", () => {
  const { executable, skipped } = selectAccounts({
    ...base,
    terminated: new Set([4]),
    accounts: [
      active(1),
      active(2, { farmer: { status: "frozen" } }),
      active(3, { farmer: { status: "banned" } }),
      active(4),
      active(5, { farmingEnabled: false }),
    ],
  });

  assert.deepEqual(ids(executable), [1]);
  assert.deepEqual(ids(skipped), [2, 3, 4, 5]);
});

test("non-telegram farmers require an existing farmer", () => {
  const { executable } = selectAccounts({
    ...base,
    platform: "web",
    accounts: [active(1), fresh(2)],
  });

  assert.deepEqual(ids(executable), [1]);
});

test("a user run only considers that account", () => {
  const { executable, primaryAccount } = selectAccounts({
    ...base,
    user: "2",
    accounts: [active(1), active(2)],
  });

  assert.equal(primaryAccount, undefined);
  assert.deepEqual(ids(executable), [2]);
});

test("skipped proxies go to executable accounts without one", () => {
  const executable = [active(1), active(2, { proxy: "own" }), active(3)];
  const skipped = [active(4, { proxy: "p4" })];

  assignUnusedProxies(executable, skipped);

  assert.deepEqual(
    executable.map((item) => item.proxy),
    ["p4", "own", undefined],
  );
});
