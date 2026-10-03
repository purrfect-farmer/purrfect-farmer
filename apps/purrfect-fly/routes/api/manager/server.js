import { exportBackup, importBackup } from "../../../lib/backup.js";

import path from "path";
import { spawn } from "child_process";
import updateProxies from "../../../actions/update-proxies.js";

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  /** Update proxies */
  fastify.post("/update-proxies", async () => {
    await updateProxies();
  });

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
