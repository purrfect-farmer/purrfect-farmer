import AutoModule from "@purrfect/shared/lib/farmer/AutoModule.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

const FARMER_IDS = ["atf", "diggo", "mrg", "victors", "monsterland"];

/** Methods the Fly runner, the Auto system and the extension call on a farmer */
const CONTRACT_METHODS = [
  "adoptSignal",
  "configureStartupLink",
  "start",
  "executeTask",
  "getElapsedTime",
  "load",
  "persist",
  "process",
  "setApi",
  "setLogger",
  "setCaptcha",
  "setUserAgent",
  "setTelegramWebApp",
  "setTelegramClient",
  "setClient",
  "setCacheAuth",
  "setCacheTelegramWebApp",
  "setAllowProfileUpdates",
  "setPromptFunctions",
  "setAutoWalletProvider",
  "setQuickRun",
  "setAuth",
  "setAuthHeaders",
  "configureAuthHeaders",
  "registerDelayInterceptor",
  "restoreCachedAuthData",
  "fetchAuth",
  "fetchMeta",
  "getAuthHeaders",
  "shouldRetryRequest",
  "getCookies",
  "updateWebAppData",
  "notifyAdmin",
  "getUserId",
  "getInitData",
  "getReferralLink",
  "getReferralsCount",
  "canJoinTelegramLink",
  "joinTelegramLink",
  "canUpdateProfile",
  "updateProfile",
  "connectAutoWallet",
  "verifyAutoWallet",
  "refreshAutoState",
  "refreshAutoSummary",
  "startAutoMining",
  "getAutoSummary",
  "storeAutoSnapshot",
  "readAutoWithdrawals",
  "withdraw",
  "hasPendingWithdrawal",
  "getWithdrawalGuard",
];

/** The tool tree each farmer exposes, as `id|icon|title|dispatch` per tool */
const TOOL_TREES = JSON.parse(
  fs.readFileSync(new URL("./fixtures/farmer-tools.json", import.meta.url)),
);

/** Load a farmer class by its folder name */
async function loadFarmer(id) {
  const module = await import(`@purrfect/shared/farmers/${id}/index.js`);
  return module.default;
}

for (const id of FARMER_IDS) {
  test(`${id} farmer exposes the external contract`, async () => {
    const FarmerClass = await loadFarmer(id);
    const farmer = new FarmerClass();

    assert.equal(FarmerClass.id, id);

    for (const name of CONTRACT_METHODS) {
      assert.equal(typeof farmer[name], "function", `${id}.${name}`);
    }
  });

  test(`${id} farmer works through a frozen ctx`, async () => {
    const FarmerClass = await loadFarmer(id);
    const { ctx, core } = new FarmerClass();

    assert.ok(Object.isFrozen(ctx), "ctx is frozen");
    assert.ok(Object.isFrozen(core), "core is frozen");
    assert.ok(ctx.auto instanceof AutoModule, "ctx.auto is an AutoModule");

    for (const name of ["flow", "snapshot", "walletVersion", "withdrawals"]) {
      assert.ok(ctx[name], `ctx.${name}`);
    }
  });

  test(`${id} farmer keeps its tool tree`, async () => {
    const FarmerClass = await loadFarmer(id);
    const tools = new FarmerClass().tools;

    const tree = tools.map((group) => [
      group.name,
      group.list.map((tool) =>
        [tool.id, tool.icon, tool.title, tool.dispatch].join("|"),
      ),
    ]);

    assert.deepEqual(tree, TOOL_TREES[id]);

    for (const tool of tools.flatMap((group) => group.list)) {
      assert.equal(typeof tool.action, "function", `${id} tool ${tool.id}`);
    }
  });
}
