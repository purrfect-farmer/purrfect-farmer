import "../../config/env.js";

import JobNotifier from "../../lib/bot/JobNotifier.js";
import app from "../../config/app.js";
import assert from "node:assert/strict";
import { test } from "node:test";

/** A bot that records where each message went */
function createFakeBot() {
  const sent = [];
  const record = (target) => async (messages) => {
    sent.push({ target, text: messages.join("\n") });
  };

  return {
    sent,
    sendAdminMessage: record("admin"),
    sendOperationMessage: record("operations"),
    sendUserMessage: async (id, messages) =>
      sent.push({ target: `user:${id}`, text: messages.join("\n") }),
  };
}

test("steps count up and keep their order", async () => {
  const bot = createFakeBot();
  const notifier = new JobNotifier({ title: "Job", total: 2, bot });

  notifier.start();
  notifier.step({ icon: "✅", label: "First" });
  notifier.step({ icon: "✅", label: "Second" });
  await notifier.complete(["<b>Done</b>: 2"]);

  const operations = bot.sent
    .filter((item) => item.target === "operations")
    .map((item) => item.text);

  assert.equal(operations.length, 4);
  assert.match(operations[0], /Started/);
  assert.match(operations[1], /First[\s\S]*Progress<\/b>: 1\/2/);
  assert.match(operations[2], /Second[\s\S]*Progress<\/b>: 2\/2/);
  assert.match(operations[3], /Completed/);
});

test("the operator gets a copy unless they are the admin", async () => {
  const previousAdmin = app.admin.telegramId;
  app.admin.telegramId = "100";

  try {
    const operatorBot = createFakeBot();
    await new JobNotifier({
      title: "Job",
      total: 1,
      operatorId: "200",
      bot: operatorBot,
    }).start();

    const adminBot = createFakeBot();
    await new JobNotifier({
      title: "Job",
      total: 1,
      operatorId: "100",
      bot: adminBot,
    }).start();

    assert.deepEqual(operatorBot.sent.map((item) => item.target).sort(), [
      "admin",
      "operations",
      "user:200",
    ]);
    assert.deepEqual(adminBot.sent.map((item) => item.target).sort(), [
      "admin",
      "operations",
    ]);
  } finally {
    app.admin.telegramId = previousAdmin;
  }
});

test("a failing send does not stop the next message", async () => {
  const bot = createFakeBot();
  let calls = 0;

  bot.sendOperationMessage = async () => {
    calls++;
    if (calls === 1) throw new Error("flood");
  };

  const notifier = new JobNotifier({ title: "Job", total: 1, bot });

  notifier.start();
  await notifier.step({ icon: "✅", label: "Step" });

  assert.equal(calls, 2);
});
