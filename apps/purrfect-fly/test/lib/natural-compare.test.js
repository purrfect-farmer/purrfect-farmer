import assert from "node:assert/strict";
import test from "node:test";

import { naturalCompare } from "@purrfect/shared/lib/naturalCompare.js";

test("numbers inside names sort by value", () => {
  const names = ["V-10", "V-2", "V-1", "V-21", "V-3"];

  assert.deepEqual(names.sort(naturalCompare), [
    "V-1",
    "V-2",
    "V-3",
    "V-10",
    "V-21",
  ]);
});

test("case is ignored and letters still order before numbers grow", () => {
  assert.deepEqual(["b2", "A10", "a2", "B1"].sort(naturalCompare), [
    "a2",
    "A10",
    "B1",
    "b2",
  ]);
});

test("ids and missing values compare as text", () => {
  assert.deepEqual([1000, 20, null, 3].sort(naturalCompare), [
    null,
    3,
    20,
    1000,
  ]);
});
