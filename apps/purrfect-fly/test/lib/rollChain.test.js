import assert from "node:assert/strict";
import { test } from "node:test";
import { orderByFunder, orderRollChain } from "../../lib/auto/rollChain.js";

test("nobody is funded by the wallet that funded them last time", () => {
  const links = [
    { item: "a", address: "A", lastFunder: "M" },
    { item: "b", address: "B", lastFunder: null },
  ];

  const chain = orderRollChain(links, "M").map((link) => link.item);

  assert.deepEqual(chain, ["b", "a"]);
});

test("a repeat is taken rather than stalling the chain", () => {
  const links = [{ item: "a", address: "A", lastFunder: "M" }];

  assert.deepEqual(
    orderRollChain(links, "M").map((link) => link.item),
    ["a"],
  );
});

test("orderByFunder reads each item's account and funder", () => {
  const items = [
    { account: { address: "A" }, lastFunder: "M" },
    { account: { address: "B" }, lastFunder: "A" },
  ];

  const ordered = orderByFunder(
    items,
    (item) => item.lastFunder,
    "M",
    (item) => item.account,
  );

  assert.deepEqual(
    ordered.map((item) => item.account.address),
    ["B", "A"],
  );
});
