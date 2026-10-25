import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import {
  closeTestClient,
  createTestClient,
  skipWithoutSession,
} from "./session.js";
import { extractTgWebAppData } from "../../utils/telegram.js";

let client;

before(async () => {
  if (!skipWithoutSession) client = await createTestClient();
});

after(() => closeTestClient(client));

test(
  "opens a bot through its menu button",
  { skip: skipWithoutSession, timeout: 60_000 },
  async () => {
    const webview = await client.getWebview("https://t.me/LootVaultDexBot", {
      allowCache: false,
    });
    const { initData } = extractTgWebAppData(webview.url);

    assert.equal(new URL(webview.url).protocol, "https:");
    assert.ok(initData);
  },
);
