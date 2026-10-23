import WithdrawalQueue, {
  statusClassifier,
} from "@purrfect/shared/lib/farmer/WithdrawalQueue.js";

import assert from "node:assert/strict";
import { test } from "node:test";

const rows = (...statuses) => statuses.map((status, id) => ({ id, status }));
const ids = (list) => list.map((row) => row.id);

test("status lists classify rows, unknown statuses fall through", () => {
  const classify = statusClassifier({
    pending: ["pending"],
    approved: ["paid"],
    flagged: ["rejected"],
  });

  assert.equal(classify({ status: "pending" }), "pending");
  assert.equal(classify({ status: "paid" }), "approved");
  assert.equal(classify({ status: "rejected" }), "flagged");
  assert.equal(classify({ status: "weird" }), null);
});

test("otherwise and normalize cover catch-all and case-folded drops", () => {
  const restFlagged = statusClassifier({
    pending: ["pending"],
    approved: ["approved"],
    otherwise: "flagged",
  });
  const lowered = statusClassifier({
    pending: ["pending", "processing"],
    normalize: (status) => String(status || "").toLowerCase(),
  });

  assert.equal(restFlagged({ status: "anything" }), "flagged");
  assert.equal(lowered({ status: "PROCESSING" }), "pending");
  assert.equal(lowered({}), null);
});

test("split keeps row order and only the configured categories", () => {
  const queue = new WithdrawalQueue({
    read: () => [],
    classify: statusClassifier({ pending: ["p"], flagged: ["f"] }),
    categories: ["pending", "flagged"],
  });

  const result = queue.split(rows("p", "f", "x", "p"));

  assert.deepEqual(Object.keys(result), ["pending", "flagged"]);
  assert.deepEqual(ids(result.pending), [0, 3]);
  assert.deepEqual(ids(result.flagged), [1]);
});

test("hasPending prepares, then honours the drop's active flag", async () => {
  const calls = [];
  const queue = new WithdrawalQueue({
    read: () => {
      calls.push("read");
      return rows("done");
    },
    classify: statusClassifier({ pending: ["p"] }),
    prepare: async () => calls.push("prepare"),
    hasActive: async () => {
      calls.push("active");
      return true;
    },
  });

  assert.equal(await queue.hasPending(), true);
  assert.deepEqual(calls, ["prepare", "active"]);
});

test("pending reads without preparing, load prepares first", async () => {
  const calls = [];
  const queue = new WithdrawalQueue({
    read: async () => {
      calls.push("read");
      return rows("p", "a");
    },
    classify: statusClassifier({ pending: ["p"], approved: ["a"] }),
    prepare: async () => calls.push("prepare"),
  });

  assert.deepEqual(ids(await queue.pending()), [0]);
  assert.deepEqual(calls, ["read"]);

  const queued = await queue.load();

  assert.deepEqual(calls, ["read", "prepare", "read"]);
  assert.deepEqual(ids(queued.approved), [1]);
  assert.deepEqual(queued.flagged, []);
});
