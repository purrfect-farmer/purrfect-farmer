import * as bcrypt from "bcryptjs";
import * as dateFns from "date-fns";

import { exportBackup, importBackup } from "../../../lib/backup.js";

import farmers from "../../../farmers/index.js";
import fsp from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import updateProxies from "../../../actions/update-proxies.js";

const farmerSchema = {
  body: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {object} opts
 */
export default async function (fastify, opts) {
  /** Login */
  fastify.post(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string" },
            password: { type: "string" },
          },
        },
      },
    },
    async function (request, reply) {
      const user = await fastify.db.User.findOne({
        attributes: { include: ["password"] },
        where: {
          [fastify.db.Sequelize.Op.or]: {
            username: request.body.email,
            email: request.body.email,
          },
        },
      });

      if (!user) {
        return reply.badRequest("These credentials do not match any record!");
      }

      /** Compare Password */
      const valid = await bcrypt.compare(request.body.password, user.password);

      if (!valid) {
        return reply.badRequest("Incorrect Password!");
      }

      /** JWT Token */
      const token = fastify.jwt.sign({ id: user.id });

      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          emailVerifiedAt: user.emailVerifiedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      });
    },
  );

  fastify.register((fastify) => {
    /** Register JWT Hook */
    fastify.addHook("onRequest", fastify.verifyJWT);

    /** Get User */
    fastify.get("/user", async (request) => {
      const user = await fastify.db.User.findByPk(request.user.id);
      return user;
    });

    /** Get .env */
    fastify.get("/env", async (request) => {
      const env = await fsp.readFile(fastify.app.envPath, "utf-8");
      return { content: env };
    });

    /** Update .env */
    fastify.post(
      "/env",
      {
        schema: {
          body: {
            type: "object",
            required: ["content"],
            properties: {
              content: { type: "string" },
            },
          },
        },
      },
      async (request) => {
        await fsp.copyFile(fastify.app.envPath, fastify.app.envBackupPath);
        await fsp.writeFile(fastify.app.envPath, request.body.content, "utf-8");
        setTimeout(() => {
          process.exit(0);
        }, 1000);
      },
    );

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
            },
          },
        },
      },
      async (request, reply) => {
        const { importWhiskersBackup } =
          await import("../../../lib/whiskers.js");
        const { backup, passwords, subscriptionDate } = request.body;

        /** Report how many accounts will be processed */
        const total = fastify.utils.whiskersToSessions(backup).length;

        /** Run in the background; the admin is DM'd on completion */
        importWhiskersBackup({ backup, passwords, subscriptionDate }).catch(
          (error) => {
            fastify.log.error(error, "Whiskers import failed");
          },
        );

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

    /** Update Password */
    fastify.post(
      "/update-password",
      {
        schema: {
          body: {
            type: "object",
            required: ["currentPassword", "newPassword"],
            properties: {
              currentPassword: { type: "string" },
              newPassword: { type: "string" },
            },
          },
        },
      },
      async function (request, reply) {
        const user = await fastify.db.User.findByPk(request.user.id);

        /** Compare Password */
        const valid = await bcrypt.compare(
          request.body.currentPassword,
          user.password,
        );

        if (valid) {
          await user.update({
            password: await bcrypt.hash(request.body.newPassword, 10),
          });
        } else {
          return reply.badRequest("Incorrect Password!");
        }
      },
    );

    /** Get Farmers */
    fastify.get("/farmers", async (request) => {
      const accounts = await fastify.db.Account.findAllFarmers({
        attributes: {
          exclude: !fastify.app.displayAccountTitle ? ["title"] : [],
        },
      });
      return accounts;
    });

    /** Activate All Farmer */
    fastify.post("/farmers/all/activate", async (request, reply) => {
      const [affectedCount] = await fastify.db.Farmer.update(
        { status: "active", errorCount: 0 },
        {
          where: {
            status: {
              [fastify.db.Sequelize.Op.not]: "frozen",
            },
          },
        },
      );

      return reply.send({ success: true, affectedCount });
    });

    /** Run Farmers */
    fastify.post(
      "/farmers/run",
      { schema: farmerSchema },
      async (request, reply) => {
        const FarmerClass = farmers[request.body.id];

        /** Execute */
        if (FarmerClass) {
          FarmerClass.run();
        }

        return reply.send({ success: true });
      },
    );

    /** Activate Farmer */
    fastify.post(
      "/farmers/activate",
      { schema: farmerSchema },
      async (request) => {
        await fastify.db.Farmer.update(
          { status: "active", errorCount: 0 },
          { where: { id: request.body.id } },
        );
      },
    );

    /** Disconnect Farmer */
    fastify.post(
      "/farmers/disconnect",
      { schema: farmerSchema },
      async (request) => {
        await fastify.db.Farmer.update(
          { status: "inactive" },
          { where: { id: request.body.id } },
        );
      },
    );

    /** Get Members */
    fastify.get("/members", async (request) => {
      const accounts = await fastify.db.Account.findAllWithActiveSubscription({
        required: false,
        attributes: {
          exclude: !fastify.app.displayAccountTitle ? ["title"] : [],
        },
      });

      return accounts.sort((a, b) => {
        if (fastify.app.displayAccountTitle) {
          return (a.title || "TGUser").localeCompare(b.title || "TGUser");
        } else {
          return (a.user?.username || a.id)
            .toString()
            .localeCompare((b.user?.username || b.id).toString());
        }
      });
    });

    /** Update Subscription */
    fastify.post(
      "/members/subscription",
      {
        schema: {
          body: {
            type: "object",
            required: ["id"],
            properties: {
              id: { type: "string" },
              date: { type: "string" },
            },
          },
        },
      },
      async (request) => {
        const ids = request.body.id
          .split(/[,\s]+/)
          .map((s) => Number(s.trim()))
          .filter(Boolean);

        for (const id of ids) {
          /** Find or create account */
          const [account] = await fastify.db.Account.findOrCreate({
            where: {
              id,
            },
            include: [
              {
                required: false,
                association: "subscriptions",
                where: {
                  active: true,
                },
              },
            ],
          });

          if (account.subscription) {
            /** Update subscription */
            await account.subscription.update({
              endsAt: request.body.date
                ? new Date(request.body.date)
                : dateFns.addDays(new Date(account.subscription.endsAt), 30),
            });
          } else {
            /** Create subscription */
            await account.createSubscription({
              active: true,
              startsAt: new Date(),
              endsAt: request.body.date
                ? new Date(request.body.date)
                : dateFns.addDays(new Date(), 30),
            });
          }
        }

        /** Update proxies */
        await updateProxies();
      },
    );

    /** Kick Member */
    fastify.post(
      "/members/kick",
      {
        schema: {
          body: {
            type: "object",
            required: ["id"],
            properties: {
              id: { type: "string" },
            },
          },
        },
      },
      async (request) => {
        const account = await fastify.db.Account.findByPk(request.body.id);
        if (account) {
          /** Destroy Account */
          await account.destroy();
        }
      },
    );

    /** Kick All Members */
    fastify.post("/members/kick/all", async () => {
      const accounts = await fastify.db.Account.findAll();
      for (const account of accounts) {
        /** Destroy Account */
        await account.destroy();
      }
    });
  });
}
