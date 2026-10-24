import TelegramIdentity from "@purrfect/shared/lib/farmer/TelegramIdentity.js";
import TaskRunner from "@purrfect/shared/lib/farmer/TaskRunner.js";
import TelegramActions from "@purrfect/shared/lib/farmer/TelegramActions.js";
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

/** A core whose logger and delays are recorded, with colours as tags */
function createRunnerCore({ aborted = false } = {}) {
  const calls = [];
  const colour = (name) => (text) => `<${name}>${text}`;

  const core = {
    signal: { aborted },
    logger: {
      newline: () => calls.push(["newline"]),
      log: (message) => calls.push(["log", message]),
      warn: (message) => calls.push(["warn", message]),
      c: {
        magenta: colour("m"),
        yellow: colour("y"),
        gray: colour("g"),
        green: colour("gr"),
        red: colour("r"),
      },
    },
    utils: {
      delayForSeconds: async (seconds) => calls.push(["delay", seconds]),
      dateFns: { formatDistanceToNowStrict: () => "5 seconds" },
    },
  };

  return { core, calls };
}

test("a task logs, waits around its callback and records itself", async () => {
  const { core, calls } = createRunnerCore();
  const runner = new TaskRunner({ core, quickRun: () => false });

  assert.ok(runner.startedAt instanceof Date);
  assert.equal(runner.currentTask, null);

  await runner.execute("Mining", async () => calls.push(["callback"]));

  assert.equal(runner.currentTask, "Mining");
  assert.ok(runner.currentTaskStartedAt instanceof Date);
  assert.equal(runner.elapsed(), "5 seconds");
  assert.deepEqual(calls, [
    ["newline"],
    ["log", "<g>⚙ Executing task: <m>Mining"],
    ["delay", 5],
    ["callback"],
    ["log", "<gr>✔ Completed task: <m>Mining"],
    ["delay", 5],
  ]);
});

test("a failing task is logged, still waits, then rethrows", async () => {
  const { core, calls } = createRunnerCore();
  const runner = new TaskRunner({ core, quickRun: () => false });

  await assert.rejects(
    runner.execute("Tasks", async () => {
      throw new Error("boom");
    }),
    /boom/,
  );

  assert.deepEqual(calls.slice(-2), [
    ["log", "<r>✖ Error executing task: <m>Tasks\n   <g>boom"],
    ["delay", 5],
  ]);
});

test("aborted runs and quick-run skips never call the task", async () => {
  const aborted = createRunnerCore({ aborted: true });
  await new TaskRunner({ core: aborted.core, quickRun: () => false }).execute(
    "Tap",
    () => assert.fail("called"),
  );
  assert.deepEqual(aborted.calls, [
    ["newline"],
    ["warn", "✖ Task aborted: <m>Tap"],
  ]);

  const quick = createRunnerCore();
  const runner = new TaskRunner({ core: quick.core, quickRun: () => true });
  await runner.execute("Slow", () => assert.fail("called"), false);
  assert.deepEqual(quick.calls, [
    ["newline"],
    ["log", "<y>⚡ Skipping in quick run: <m>Slow"],
  ]);
});

/** Telegram actions over a recorded core, with joins and profile edits answered by `farmer` */
function createActions(farmer) {
  const { core, calls } = createRunnerCore();

  core.logger.error = (...args) => calls.push(["error", ...args]);
  core.utils.isTelegramChatLink = (link) => link.startsWith("https://t.me/");
  core.utils.delayForMinutes = async (minutes) =>
    calls.push(["delayMinutes", minutes]);

  const actions = new TelegramActions({
    core,
    canJoin: () => farmer.canJoin,
    join: (link) => farmer.join(link),
    canUpdateProfile: () => true,
    updateProfile: async (options) => calls.push(["profile", options]),
    allowProfileUpdates: () => farmer.allowProfileUpdates,
    launch: () => farmer.launch,
    setTelegramWebApp: (webApp) => calls.push(["webApp", webApp]),
  });

  return { actions, calls };
}

test("a chat link is joined after the wait, through the farmer's current join", async () => {
  const farmer = { canJoin: true };
  const { actions, calls } = createActions(farmer);

  farmer.join = async (link) => calls.push(["join", link]);

  assert.equal(await actions.tryToJoin("https://t.me/example"), true);
  assert.deepEqual(calls.at(-1), ["join", "https://t.me/example"]);
  assert.equal(calls.filter(([name]) => name === "delayMinutes").length, 1);

  farmer.join = async () => {
    throw new Error("flood");
  };
  assert.equal(await actions.tryToJoin("https://t.me/example"), false);

  assert.equal(await actions.tryToJoin("https://example.com/"), undefined);
  assert.equal(actions.validateTask("https://example.com/"), true);

  farmer.canJoin = false;
  assert.equal(actions.validateTask("https://t.me/example"), false);
});

test("profile edits respect the setting", async () => {
  const farmer = { allowProfileUpdates: false };
  const { actions, calls } = createActions(farmer);

  assert.equal(await actions.tryToUpdateProfile({ bio: "x" }), false);
  assert.deepEqual(calls, [
    ["warn", "Profile updates are disabled in settings"],
  ]);

  farmer.allowProfileUpdates = true;
  assert.equal(await actions.tryToUpdateProfile({ bio: "x" }), true);
});

test("a task link dwells, and the web app refreshes only for Telegram web apps", async () => {
  const farmer = {
    launch: {
      platform: "telegram",
      type: "webapp",
      telegramLink: "https://t.me/example_bot/app",
      client: { getWebview: async () => ({ url: "https://example.com/" }) },
    },
  };
  const { actions, calls } = createActions(farmer);
  const { utils } = actions.core;

  utils.extractTgWebAppData = () => ({ initData: "query_id=1" });
  utils.getInitDataUnsafe = (initData) => ({ parsed: initData });

  await actions.openTaskLink("https://example.com/task", 10);
  assert.deepEqual(calls, [["delay", 10]]);

  await actions.refreshWebApp();
  assert.deepEqual(calls.at(-1), [
    "webApp",
    { initData: "query_id=1", initDataUnsafe: { parsed: "query_id=1" } },
  ]);

  farmer.launch = { ...farmer.launch, type: "direct" };
  await actions.refreshWebApp();
  assert.equal(calls.length, 2);
});
