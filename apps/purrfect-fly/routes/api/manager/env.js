import { createEnvPatch, parseEnv } from "../../../lib/env-file.js";
import { fieldsByKey, secretKeys } from "../../../services/env-settings/schema.js";
import {
  getChangedKeys,
  getTestValues,
  resolveTarget,
} from "../../../services/env-settings/target.js";

import { ENV_TESTS } from "../../../services/env-tests/index.js";
import envStore from "../../../lib/env-store.js";
import { getSettingsForm } from "../../../services/env-settings/form.js";
import { restartSoon } from "../../../lib/process.js";

/** Reply with field errors */
const sendErrors = (reply, errors) => {
  const messages = Object.values(errors).flat();

  return reply.code(422).send({
    statusCode: 422,
    message: messages.length === 1 ? messages[0] : "Some settings need fixing.",
    errors,
  });
};

/** Body accepted by preview and save */
const targetSchema = {
  type: "object",
  properties: {
    changes: { type: "object" },
    content: { type: "string" },
    backup: { type: "string" },
    restart: { type: "boolean" },
  },
};

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  /** Get raw .env */
  fastify.get("/env", async () => {
    return { content: await envStore.readEnv() };
  });

  /** Get settings form data */
  fastify.get("/env/settings", getSettingsForm);

  /** Reveal one secret */
  fastify.post(
    "/env/reveal",
    {
      schema: {
        body: {
          type: "object",
          required: ["key"],
          properties: { key: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      if (!secretKeys.has(request.body.key)) {
        return reply.badRequest("Not a secret setting.");
      }

      const current = parseEnv(await envStore.readEnv());
      return { value: current[request.body.key] ?? "" };
    },
  );

  /** Preview a change as a diff */
  fastify.post(
    "/env/preview",
    { schema: { body: targetSchema } },
    async (request, reply) => {
      const { before, after, errors } = await resolveTarget(request.body);
      if (errors) return sendErrors(reply, errors);

      const changedKeys = getChangedKeys(before, after);
      const warnings = changedKeys
        .map((key) => fieldsByKey.get(key)?.warning)
        .filter(Boolean);

      return {
        changedKeys,
        warnings,
        patch: createEnvPatch(before, after, secretKeys),
      };
    },
  );

  /** Save .env, optionally restarting */
  fastify.post(
    "/env",
    { schema: { body: targetSchema } },
    async (request, reply) => {
      const { after, errors } = await resolveTarget(request.body);
      if (errors) return sendErrors(reply, errors);

      const backup = await envStore.writeEnv(after);
      const restart = request.body.restart ?? true;

      if (restart) restartSoon();

      return { backup, restart };
    },
  );

  /** List env backups */
  fastify.get("/env/backups", async () => {
    return envStore.listBackups();
  });

  /** Test a service with unsaved values */
  fastify.post(
    "/env/test/:service",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            service: { type: "string", enum: Object.keys(ENV_TESTS) },
          },
        },
        body: {
          type: "object",
          properties: { values: { type: "object" } },
        },
      },
    },
    async (request) => {
      const values = await getTestValues(request.body?.values);
      const results = [];

      try {
        await ENV_TESTS[request.params.service](values, results);
      } catch (error) {
        results.push({ label: "Setup", ok: false, message: error.message });
      }

      return { results };
    },
  );
}
