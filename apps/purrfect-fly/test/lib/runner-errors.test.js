import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isTransientError,
  parseRetryAfter,
} from "../../farmers/runner/errors.js";

test("5xx, timeouts and aborts are transient", () => {
  assert.equal(isTransientError({ response: { status: 502 } }), true);
  assert.equal(
    isTransientError(new Error("timeout of 60000ms exceeded")),
    true,
  );
  assert.equal(isTransientError(new Error("Request aborted")), true);
});

test("client errors are not transient", () => {
  assert.equal(isTransientError({ response: { status: 401 } }), false);
  assert.equal(isTransientError(null), false);
});

test("Retry-After accepts seconds and HTTP dates", () => {
  assert.equal(parseRetryAfter("3"), 3000);
  assert.equal(parseRetryAfter(null), null);
  assert.equal(parseRetryAfter("not a date"), null);

  const later = new Date(Date.now() + 10_000).toUTCString();
  assert.ok(parseRetryAfter(later) > 8000);
});
