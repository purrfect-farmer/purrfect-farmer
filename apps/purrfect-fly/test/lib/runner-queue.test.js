import "../../config/env.js";

import assert from "node:assert/strict";
import { test } from "node:test";

const { default: RunnerQueue } = await import(
  "../../farmers/runner/RunnerQueue.js"
);

/** Fake Runner whose primary resolves only when `resolves` is set */
const createRunner = ({ resolved = false, resolves = true } = {}) => {
  const executed = [];
  const Runner = {
    title: "Test",
    primaryAccountId: 1,
    skipExecutionOfNewAccount: false,
    runners: new Map(),
    primaryLink: { resolved },
    logger: { info() {}, warn() {}, error() {} },
    utils: { delayForSeconds: async () => {} },
    async execute(instance) {
      executed.push(instance.account.id);
      if (instance.account.id === Runner.primaryAccountId && resolves) {
        Runner.primaryLink.resolved = true;
      }
    },
  };

  Runner.runQueue = new RunnerQueue(Runner);

  return { Runner, executed };
};

/** Queue farmed accounts so the stagger is skipped */
const queue = (Runner, ids) => {
  for (const id of ids) {
    const instance = {
      account: { id, farmer: { status: "active" } },
      signal: { aborted: false },
    };
    Runner.runners.set(id, instance);
    Runner.runQueue.push(instance);
  }
};

test("the primary account runs alone before the others", async () => {
  const { Runner, executed } = createRunner();
  queue(Runner, [2, 1, 3]);

  await Runner.runQueue.process();

  assert.equal(executed[0], 1);
  assert.deepEqual([...executed].sort(), [1, 2, 3]);
});

test("nothing runs while the primary account is missing", async () => {
  const { Runner, executed } = createRunner();
  queue(Runner, [2, 3]);

  await Runner.runQueue.process();

  assert.deepEqual(executed, []);
  assert.equal(Runner.runQueue.items.length, 0);
  assert.equal(Runner.runners.size, 0);
});

test("others are held when the primary link fails to resolve", async () => {
  const { Runner, executed } = createRunner({ resolves: false });
  queue(Runner, [2, 1, 3]);

  await Runner.runQueue.process();

  assert.deepEqual(executed, [1]);
  assert.equal(Runner.runners.has(2), false);
  assert.equal(Runner.runners.has(3), false);
});

test("everyone runs once the link is resolved", async () => {
  const { Runner, executed } = createRunner({ resolved: true });
  queue(Runner, [2, 3]);

  await Runner.runQueue.process();

  assert.deepEqual([...executed].sort(), [2, 3]);
});
