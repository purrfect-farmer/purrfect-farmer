import AdClients from "@purrfect/shared/lib/farmer/AdClients.js";
import TurnstileGate from "@purrfect/shared/lib/farmer/TurnstileGate.js";
import assert from "node:assert/strict";
import { test } from "node:test";

/** A gate whose every step is recorded */
function createGate({ canSolve = true, submit } = {}) {
  const calls = [];
  const logger = { info: (message) => calls.push(["info", message]) };

  const gate = new TurnstileGate({
    siteKey: "site",
    pageUrl: "https://example.com/",
    canSolve: () => canSolve,
    solveTurnstile: async (params) => {
      calls.push(["solve", params]);
      return "token";
    },
    submit: submit || (async (token) => calls.push(["submit", token])),
    logger: () => logger,
    onStart: () => calls.push(["start"]),
    beforeSolve: async () => calls.push(["beforeSolve"]),
  });

  return { gate, calls };
}

test("concurrent callers share one Turnstile solve", async () => {
  const { gate, calls } = createGate();

  await Promise.all([gate.obtain(), gate.obtain()]);

  assert.deepEqual(calls, [
    ["start"],
    ["beforeSolve"],
    ["info", "Solving the security check..."],
    ["solve", { siteKey: "site", pageUrl: "https://example.com/" }],
    ["submit", "token"],
  ]);

  await gate.obtain();
  assert.equal(calls.filter(([name]) => name === "solve").length, 2);
});

test("without a solver the gate refuses after onStart", async () => {
  const { gate, calls } = createGate({ canSolve: false });

  await assert.rejects(() => gate.obtain(), /no captcha provider/);
  assert.deepEqual(calls, [["start"]]);
  assert.equal(gate.pending, null);
});

test("a refused token is reported to every caller", async () => {
  const { gate } = createGate({
    submit: async () => {
      throw new Error("refused");
    },
  });

  const results = await Promise.allSettled([gate.obtain(), gate.obtain()]);

  assert.deepEqual(
    results.map((result) => result.reason?.message),
    ["refused", "refused"],
  );
});

test("ad clients are created once, with their network settings", () => {
  let reads = 0;
  const ads = new AdClients(
    () => {
      reads++;
      return { initData: "init", origin: "https://example.com" };
    },
    { monetag: { zoneId: "zone" } },
  );

  assert.equal(reads, 0);
  assert.equal(ads.monetag, ads.monetag);
  assert.equal(ads.monetag.zoneId, "zone");
  assert.equal(ads.adsgram.constructor.name, "AdsGramClient");
  assert.equal(reads, 2);
});
