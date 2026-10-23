import "./config/boot-guard.js";
import "./config/env.js";
import "./startup.js";
import "./cron.js";

import AutoLoad from "@fastify/autoload";
import bot from "./lib/bot.js";
import cors from "@fastify/cors";
import envStore from "./lib/env-store.js";
import jwt from "@fastify/jwt";
import path from "node:path";
import { getCurrentPath } from "./lib/path.js";

const { __dirname } = getCurrentPath(import.meta.url);

/** Fastify options, applied when started with --options */
export const options = {
  logger: process.env.NODE_ENV !== "production",
};

export default async function (fastify, opts) {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET_KEY,
  });

  if (process.env.NODE_ENV !== "production") {
    await fastify.register(cors);
  }

  /** Server is up: the env is good, report any automatic rollback */
  fastify.addHook("onListen", async () => {
    const restored = await envStore.confirmBoot();

    if (restored) {
      await bot?.sendAdminMessage([
        "⚠️ <b>Settings rolled back</b>",
        `The server failed to start with the new settings, so backup <code>${restored.backup}</code> was restored.`,
      ]);
    }
  });

  /** Shared decorators and hooks */
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    options: Object.assign({}, opts),
  });

  /** Routes, prefixed by their folder */
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes"),
    options: Object.assign({}, opts),
  });
}
