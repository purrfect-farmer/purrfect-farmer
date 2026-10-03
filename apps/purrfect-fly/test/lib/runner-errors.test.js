import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isProxyConnectError,
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

test("proxy connect failures are retryable", () => {
  assert.equal(isProxyConnectError(new Error("Proxy timeout")), true);
  assert.equal(isProxyConnectError(new Error("Bad response: 502")), true);
  assert.equal(isProxyConnectError({ code: "ECONNREFUSED" }), true);
});

test("other failures are not proxy connect errors", () => {
  assert.equal(
    isProxyConnectError(new Error("timeout of 60000ms exceeded")),
    false,
  );
  assert.equal(isProxyConnectError({ response: { status: 401 } }), false);
  assert.equal(
    isProxyConnectError({ code: "ERR_CANCELED", message: "canceled" }),
    false,
  );
  assert.equal(isProxyConnectError(null), false);
});
