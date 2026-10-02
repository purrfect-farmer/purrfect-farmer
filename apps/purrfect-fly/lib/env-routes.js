import {
  applyChanges,
  createEnvPatch,
  findInvalidLines,
  isValidKey,
  maskSecret,
  parseEnv,
} from "./env-file.js";
import { getEnvSchema, validateField } from "../config/env-schema.js";

import { Bot } from "grammy";
import CaptchaSolver from "@purrfect/shared/lib/CaptchaSolver.js";
import axios from "axios";
import envStore from "./env-store.js";
import farmers from "../farmers/index.js";
import proxy from "./proxy.js";

/** Schema plus lookups */
const schema = getEnvSchema(farmers);
const fieldsByKey = new Map(schema.fields.map((field) => [field.key, field]));
const groupTitles = new Map(schema.groups.map((group) => [group.id, group.title]));
const secretKeys = new Set(
  schema.fields.filter((field) => field.type === "secret").map((field) => field.key),
);

/** Section a key belongs to when it is added to the file */
const sectionOf = (key) => fieldsByKey.get(key)?.group ?? "";
const sectionTitle = (section) => groupTitles.get(section) ?? section;

/** Reply with field errors */
const sendErrors = (reply, errors) => {
  const messages = Object.values(errors).flat();

  return reply.code(422).send({
    statusCode: 422,
    message: messages.length === 1 ? messages[0] : "Some settings need fixing.",
    errors,
  });
};

/** Normalize a submitted value to text */
const toText = (value) =>
  typeof value === "boolean" || typeof value === "number"
    ? String(value)
    : value;

/** Validate a changes map, returns errors keyed by env key */
function validateChanges(changes) {
  const errors = {};

  for (const [key, value] of Object.entries(changes)) {
    const field = fieldsByKey.get(key);

    if (!isValidKey(key)) {
      errors[key] = ["Names may only use letters, numbers and underscores."];
    } else if (value === null) {
      if (field?.required) errors[key] = [`${field.label} cannot be removed.`];
    } else if (typeof value !== "string") {
      errors[key] = ["Invalid value."];
    } else if (field) {
      const error = validateField(field, value);
      if (error) errors[key] = [error];
    } else if (/[\r\n]/.test(value)) {
      errors[key] = ["Must be a single line."];
    }
  }

  return errors;
}

/** Validate raw content against the current env, returns a list of problems */
function validateContent(content, current) {
  const problems = [];
  const invalidLines = findInvalidLines(content);

  if (invalidLines.length) {
    problems.push(
      `Line ${invalidLines.join(", ")} is not a comment or KEY=value.`,
    );
  }

  const next = parseEnv(content);
  const keys = new Set([...Object.keys(current), ...Object.keys(next)]);

  for (const key of keys) {
    const field = fieldsByKey.get(key);
    if (!field || current[key] === next[key]) continue;

    const error = validateField(field, next[key] ?? "");
    if (error) problems.push(`${key}: ${error}`);
  }

  return problems;
}

/** Work out the new content from changes, raw content or a backup */
async function resolveTarget(body) {
  const before = await envStore.readEnv();
  const current = parseEnv(before);

  if (body.changes) {
    const changes = Object.fromEntries(
      Object.entries(body.changes).map(([key, value]) => [key, toText(value)]),
    );
    const errors = validateChanges(changes);

    if (Object.keys(errors).length) return { before, errors };

    return {
      before,
      after: applyChanges(before, changes, sectionOf, sectionTitle),
    };
  }

  const field = typeof body.backup === "string" ? "backup" : "content";
  const after =
    field === "backup"
      ? await envStore.readBackup(body.backup).catch(() => null)
      : body.content;

  if (typeof after !== "string") {
    return {
      before,
      errors: {
        [field]: [field === "backup" ? "Backup not found." : "Nothing to save."],
      },
    };
  }

  const problems = validateContent(after, current);

  return problems.length
    ? { before, errors: { [field]: [problems.join("\n")] } }
    : { before, after };
}

/** Keys whose value differs between two contents */
function getChangedKeys(before, after) {
  const a = parseEnv(before);
  const b = parseEnv(after);

  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
    (key) => a[key] !== b[key],
  );
}

/** Values to test with: current env overlaid with unsaved form values */
async function getTestValues(values = {}) {
  const current = parseEnv(await envStore.readEnv());

  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined) current[key] = toText(value);
  }

  return current;
}

/** Run a check and record its outcome, returns whether it passed */
async function check(results, label, fn) {
  try {
    const message = await fn();
    results.push({ label, ok: true, message });
    return true;
  } catch (error) {
    results.push({
      label,
      ok: false,
      message:
        error.description ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message,
    });
    return false;
  }
}

/** Connection tests per service */
const TESTS = {
  async telegram(values, results) {
    const token = values.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("Bot token is empty.");

    const bot = new Bot(token);
    const text = "✅ Purrfect Fly test message";

    const connected = await check(results, "Bot token", async () => {
      const me = await bot.api.getMe();
      return `Connected as @${me.username}`;
    });

    if (!connected) return;

    if (values.TELEGRAM_CHAT_ID) {
      const threads = [
        "TELEGRAM_FARMING_THREAD_ID",
        "TELEGRAM_ANNOUNCEMENT_THREAD_ID",
        "TELEGRAM_ERROR_THREAD_ID",
        "TELEGRAM_OPERATIONS_THREAD_ID",
      ].filter((key) => values[key]);

      if (threads.length) {
        for (const key of threads) {
          await check(results, fieldsByKey.get(key).label, async () => {
            await bot.api.sendMessage(values.TELEGRAM_CHAT_ID, text, {
              message_thread_id: Number(values[key]),
            });
            return "Message sent";
          });
        }
      } else {
        await check(results, "Group chat", async () => {
          await bot.api.sendMessage(values.TELEGRAM_CHAT_ID, text);
          return "Message sent";
        });
      }
    }

    if (values.SERVER_ADMIN_TELEGRAM_ID) {
      await check(results, "Admin", async () => {
        await bot.api.sendMessage(values.SERVER_ADMIN_TELEGRAM_ID, text);
        return "Message sent";
      });
    }
  },

  async captcha(values, results) {
    await check(results, "API key", async () => {
      const solver = new CaptchaSolver(
        values.CAPTCHA_PROVIDER || "2captcha",
        values.CAPTCHA_API_KEY,
      );
      if (!solver.isConfigured()) throw new Error("API key is empty.");

      const balance = await solver.getBalance();
      return `Balance: ${balance}`;
    });
  },

  async proxy(values, results) {
    await check(results, "Proxy list", async () => {
      const list = await proxy.fetchListFrom({
        provider: values.PROXY_PROVIDER || "webshare",
        apiKey: values.PROXY_API_KEY || "",
        planId: values.PROXY_PLAN_ID || "",
        page: Number(values.PROXY_PAGE) || 1,
        pageSize: Number(values.PROXY_PAGE_SIZE) || 100,
      });

      if (!list.length) throw new Error("Provider returned no proxies.");
      return `${list.length} proxies found`;
    });
  },

  async seeker(values, results) {
    await check(results, "Seeker server", async () => {
      if (!values.SEEKER_SERVER) throw new Error("Server URL is empty.");

      const address = await axios
        .get("https://api.ipify.org?format=json", { timeout: 5000 })
        .then((response) => response.data.ip);

      await axios.post(
        `${values.SEEKER_SERVER.replace(/\/+$/, "")}/api/servers/update`,
        { key: values.SEEKER_KEY, name: values.APP_NAME, address },
        { timeout: 10_000 },
      );

      return `Reported ${address}`;
    });
  },
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
 * Env settings routes, registered inside the authenticated manager scope
 *
 * @param {import("fastify").FastifyInstance} fastify
 */
export default function registerEnvRoutes(fastify) {
  /** Get raw .env */
  fastify.get("/env", async () => {
    return { content: await envStore.readEnv() };
  });

  /** Get settings form data */
  fastify.get("/env/settings", async () => {
    const current = parseEnv(await envStore.readEnv());
    const values = {};
    const secrets = {};
    const issues = {};

    for (const field of schema.fields) {
      const value = current[field.key];

      if (field.type === "secret") {
        secrets[field.key] = { isSet: Boolean(value), preview: maskSecret(value) };
      } else if (value !== undefined) {
        values[field.key] = value;
      }

      if (value !== undefined || field.required) {
        const error = validateField(field, value ?? "");
        if (error) issues[field.key] = error;
      }
    }

    return { groups: schema.groups, fields: schema.fields, values, secrets, issues };
  });

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

      if (restart) {
        setTimeout(() => {
          process.exit(0);
        }, 1000);
      }

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
          properties: { service: { type: "string", enum: Object.keys(TESTS) } },
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
        await TESTS[request.params.service](values, results);
      } catch (error) {
        results.push({ label: "Setup", ok: false, message: error.message });
      }

      return { results };
    },
  );
}
