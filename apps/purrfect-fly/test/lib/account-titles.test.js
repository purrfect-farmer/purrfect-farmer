import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_ACCOUNT_TITLE_LENGTH,
  normalizeTitleUpdates,
} from "@purrfect/shared/lib/account/titles.js";

test("title updates are trimmed, one per account, the last one winning", () => {
  const titles = normalizeTitleUpdates([
    { id: 1, title: "  A1  " },
    { id: "2", title: "A2" },
    { id: 1, title: "A1 Renamed" },
  ]);

  assert.deepEqual(
    [...titles],
    [
      [1, "A1 Renamed"],
      [2, "A2"],
    ],
  );
});

test("bad ids and empty or too long titles are dropped", () => {
  const titles = normalizeTitleUpdates([
    { id: 0, title: "zero" },
    { id: -5, title: "negative" },
    { id: 1.5, title: "fraction" },
    { id: "x", title: "not a number" },
    { id: 3, title: "   " },
    { id: 4, title: 42 },
    { id: 5, title: "x".repeat(MAX_ACCOUNT_TITLE_LENGTH + 1) },
    { id: 6, title: "x".repeat(MAX_ACCOUNT_TITLE_LENGTH) },
  ]);

  assert.deepEqual([...titles.keys()], [6]);
});

test("anything but a list gives no updates", () => {
  assert.equal(normalizeTitleUpdates(null).size, 0);
  assert.equal(normalizeTitleUpdates({ id: 1, title: "A" }).size, 0);
});
