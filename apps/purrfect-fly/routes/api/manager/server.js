import { exportBackup, importBackup } from "../../../lib/backup.js";

import path from "path";
import { spawn } from "child_process";
import cleanProfiles from "../../../actions/clean-profiles.js";
import updateProxies from "../../../actions/update-proxies.js";
import {
  PROFILE_CLEAN_TEXT_MAX,
  PROFILE_FIELDS,
} from "@purrfect/shared/utils/profile.js";

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  /** Update proxies */
  fastify.post("/update-proxies", async () => {
    await updateProxies();
  });

  /** Remove a text from every account's name or bio */
  fastify.post(
    "/clean-profiles",
    {
      schema: {
        body: {
          type: "object",
          required: ["text", "fields"],
          properties: {
            text: {
              type: "string",
              minLength: 1,
              maxLength: PROFILE_CLEAN_TEXT_MAX,
            },
            fields: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              items: { type: "string", enum: Object.values(PROFILE_FIELDS) },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const text = request.body.text.trim();
      const { fields } = request.body;

      if (!text) {
        return reply.code(422).send({
          statusCode: 422,
          message: "Text is required",
        });
      }

      const total = await cleanProfiles({ text, fields });

      if (total === null) {
        return reply.code(409).send({
          statusCode: 409,
          message: "A profile cleanup is already running",
        });
      }

      return reply.send({ started: true, total });
    },
  );

  /** Import backup */
  fastify.post(
    "/import-backup",
    {
      schema: {
        body: {
          type: "object",
          required: ["backup"],
          properties: {
            backup: { type: "object" },
          },
        },
      },
    },
    async (request) => {
      await importBackup(request.body.backup);
      setTimeout(() => process.exit(0), 1000);
    },
  );

  /** Export backup */
  fastify.post("/export-backup", async () => {
    return await exportBackup();
  });

  /** Import whiskers backup */
  fastify.post(
    "/import-whiskers",
    {
      bodyLimit: 10485760, // 10 MB
      schema: {
        body: {
          type: "object",
          required: ["backup"],
          properties: {
            backup: { type: "object" },
            passwords: { type: "string" },
            subscriptionDate: { type: "string" },
            farming: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const { importWhiskersBackup } =
        await import("../../../lib/whiskers.js");
      const { backup, passwords, subscriptionDate, farming } = request.body;

      /** Report how many accounts will be processed */
      const total = fastify.utils.whiskersToEntries(backup).length;

      /** Run in the background; the admin is DM'd on completion */
      importWhiskersBackup({
        backup,
        passwords,
        subscriptionDate,
        farming,
      }).catch((error) => {
        fastify.log.error(error, "Whiskers import failed");
      });

      return reply.send({ started: true, total });
    },
  );

  /** Update Server */
  fastify.post("/update-server", async () => {
    const scriptPath = path.resolve(fastify.app.basePath, "update.sh");

    return new Promise((resolve) => {
      const child = spawn("bash", [scriptPath, "--no-restart"], {
        cwd: fastify.app.rootPath,
        env: process.env,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
        process.stdout.write(data); // log live to console
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
        process.stderr.write(data);
      });

      child.on("close", (code) => {
        if (code === 0) setTimeout(() => process.exit(0), 1000);
        resolve({ success: code === 0, code, stdout, stderr });
      });
    });
  });
}
