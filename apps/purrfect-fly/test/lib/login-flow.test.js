import assert from "node:assert/strict";
import { test } from "node:test";

import LoginFlow from "../../lib/telegram/LoginFlow.js";

/** A client whose start() walks the phone, code and password stages */
function createFakeClient({ withPassword = false } = {}) {
  const client = {
    saved: false,
    destroyed: false,
    answers: {},
    async start({ phoneNumber, phoneCode, password }) {
      client.answers.phone = await phoneNumber();
      client.answers.code = await phoneCode();
      if (withPassword) client.answers.password = await password();
    },
    async getMe() {
      return { id: 1 };
    },
    async saveSession() {
      client.saved = true;
    },
    async destroy() {
      client.destroyed = true;
    },
    async logout() {},
  };

  return client;
}

test("phone login reports each stage and ends authenticated", async (t) => {
  const client = createFakeClient({ withPassword: true });
  const flow = new LoginFlow(client);
  t.after(() => flow.clearTimeout());

  assert.deepEqual(await flow.startWithPhone(), { stage: "phone" });
  assert.deepEqual(await flow.respond("phone", "+100"), { stage: "code" });
  assert.deepEqual(await flow.respond("code", "123"), { stage: "password" });

  const done = await flow.respond("password", "secret");

  assert.deepEqual(done, { stage: "authenticated", user: { id: 1 } });
  assert.deepEqual(client.answers, {
    phone: "+100",
    code: "123",
    password: "secret",
  });
  assert.equal(client.saved, true);
  assert.equal(client.destroyed, true);
  assert.equal(flow.stage, null);
});

test("answering the wrong stage is refused", async (t) => {
  const flow = new LoginFlow(createFakeClient());
  t.after(() => flow.clearTimeout());

  await flow.startWithPhone();

  await assert.rejects(() => flow.respond("code", "123"), /Invalid stage/);
});

test("a failed start rejects the waiting stage", async (t) => {
  const client = createFakeClient();
  client.start = async () => {
    throw new Error("PHONE_NUMBER_INVALID");
  };

  const flow = new LoginFlow(client);
  t.after(() => flow.clearTimeout());

  await assert.rejects(() => flow.startWithPhone(), /PHONE_NUMBER_INVALID/);
});
