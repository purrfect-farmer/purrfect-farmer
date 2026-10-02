import "./config/boot-guard.js";
import "./config/env.js";
import "./startup.js";
import "./cron.js";

import AutoLoad from "@fastify/autoload";
import bot from "./lib/bot.js";
import cors from "@fastify/cors";
import envStore from "./lib/env-store.js";
import { fileURLToPath } from "node:url";
import jwt from "@fastify/jwt";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pass --options via CLI arguments in command to enable these options.
export const options = {
  logger: process.env.NODE_ENV !== "production",
};

export default async function (fastify, opts) {
  // Place here your custom code!
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

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    options: Object.assign({}, opts),
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes"),
    options: Object.assign({}, opts),
  });
}
