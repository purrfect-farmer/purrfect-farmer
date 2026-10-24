import TelegramIdentity from "@purrfect/shared/lib/farmer/TelegramIdentity.js";
import assert from "node:assert/strict";
import { test } from "node:test";

/** An identity over a web app that can be swapped after construction */
function createIdentity({ startParam = "link-ref" } = {}) {
  const state = { webApp: undefined };
  const drop = {
    getUrlFromInitData: (initData) => `https://example.com/#${initData}`,
  };

  const identity = new TelegramIdentity({
    webApp: () => state.webApp,
    drop: () => drop,
    startParam: () => startParam,
    fallbackLink: () => "https://t.me/example_bot/app",
  });

  return { identity, state };
}

const WEB_APP = {
  initData: "query_id=1",
  initDataUnsafe: {
    hash: "abc",
    start_param: "ref_42",
    is_premium: true,
    user: {
      id: 42,
      username: "example",
      first_name: "Ex",
      last_name: "Ample",
      photo_url: "https://example.com/p.png",
    },
  },
};

test("identity reads the web app assigned after construction", () => {
  const { identity, state } = createIdentity();

  assert.equal(identity.userId(), undefined);
  assert.equal(identity.launchURL(), "https://t.me/example_bot/app");
  assert.equal(identity.referrerStartParam(), "link-ref");

  state.webApp = WEB_APP;

  assert.equal(identity.initData(), "query_id=1");
  assert.equal(identity.initDataHash(), "abc");
  assert.equal(identity.userId(), 42);
  assert.equal(identity.username(), "example");
  assert.equal(identity.fullName(), "Ex Ample");
  assert.equal(identity.photoUrl(), "https://example.com/p.png");
  assert.equal(identity.isPremium(), true);
  assert.equal(identity.startParam(), "ref_42");
  assert.equal(identity.referrerStartParam(), "ref_42");
  assert.equal(identity.launchURL(), "https://example.com/#query_id=1");
  assert.equal(identity.initDataUnsafe(true).startParam, "ref_42");
});

test("missing names and photo fall back the way the farmer did", () => {
  const { identity, state } = createIdentity({ startParam: null });

  state.webApp = { initDataUnsafe: { user: { id: 7 } } };

  assert.equal(identity.fullName(), "");
  assert.equal(identity.photoUrl(), null);
  assert.equal(identity.isPremium(), false);
  assert.equal(identity.referrerStartParam(), "");
});

test("the user random generator is seeded by the user id", () => {
  const { identity, state } = createIdentity();

  state.webApp = WEB_APP;

  assert.equal(identity.fixedRandomNumber(), identity.fixedRandomNumber());
});
