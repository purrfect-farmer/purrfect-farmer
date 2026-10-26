import assert from "node:assert/strict";
import { test } from "node:test";
import { toRetryCount, withRetries } from "@purrfect/shared/utils/retry.js";

test("a retry count is a non-negative integer", () => {
  assert.equal(toRetryCount("3"), 3);
  assert.equal(toRetryCount(1.9), 1);
  assert.equal(toRetryCount(-2), 0);
  assert.equal(toRetryCount(undefined), 0);
  assert.equal(toRetryCount("abc"), 0);
});

test("a callback that succeeds runs once", async () => {
  const attempts = [];

  const result = await withRetries(3, async (attempt) => {
    attempts.push(attempt);
    return "done";
  });

  assert.equal(result, "done");
  assert.deepEqual(attempts, [1]);
});

test("a failing callback runs again until it succeeds", async () => {
  const retries = [];

  const result = await withRetries(
    2,
    async (attempt) => {
      if (attempt < 3) throw new Error(`fail ${attempt}`);
      return attempt;
    },
    {
      onRetry: (attempt, attempts, error) =>
        retries.push([attempt, attempts, error.message]),
    },
  );

  assert.equal(result, 3);
  assert.deepEqual(retries, [
    [2, 3, "fail 1"],
    [3, 3, "fail 2"],
  ]);
});

test("the last error is thrown once the retries run out", async () => {
  let runs = 0;

  await assert.rejects(
    withRetries(1, async (attempt) => {
      runs++;
      throw new Error(`fail ${attempt}`);
    }),
    /fail 2/,
  );
  assert.equal(runs, 2);
});

test("an error that may not be retried is thrown at once", async () => {
  let runs = 0;

  await assert.rejects(
    withRetries(
      5,
      async () => {
        runs++;
        throw new Error("removed");
      },
      { shouldRetry: (error) => error.message !== "removed" },
    ),
    /removed/,
  );
  assert.equal(runs, 1);
});
