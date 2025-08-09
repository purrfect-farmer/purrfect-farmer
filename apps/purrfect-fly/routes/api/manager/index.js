import * as bcrypt from "bcryptjs";
import * as dateFns from "date-fns";

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
    }
  );

  fastify.register((fastify) => {
    /** Register JWT Hook */
    fastify.addHook("onRequest", fastify.verifyJWT);

    /** Get User */
    fastify.get("/user", async (request) => {
      const user = await fastify.db.User.findByPk(request.user.id);
      return user;
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
          user.password
        );

        if (valid) {
          await user.update({
            password: await bcrypt.hash(request.body.newPassword, 10),
          });
        } else {
          return reply.badRequest("Incorrect Password!");
        }
      }
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

    /** Disconnect Farmer */
    fastify.post(
      "/farmers/disconnect",
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
        await fastify.db.Farmer.destroy({
          where: { id: request.body.id },
        });
      }
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
        const [account] = await fastify.db.Account.findOrCreate({
          where: {
            id: request.body.id,
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
          await account.subscription.update({
            endsAt: request.body.date
              ? new Date(request.body.date)
              : dateFns.addDays(new Date(account.subscription.endsAt), 30),
          });
        } else {
          await account.createSubscription({
            active: true,
            startsAt: new Date(),
            endsAt: request.body.date
              ? new Date(request.body.date)
              : dateFns.addDays(new Date(), 30),
          });
        }
      }
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
          if (account.session) {
            try {
              /** Create Client */
              const client = await fastify.lib.GramClient.create(
                account.session
              );

              /** Connect */
              await client.connect();

              /** Logout */
              await client.logout();
            } catch (error) {
              console.error(error);
            }
          }

          /** Destroy Account */
          await account.destroy();
        }
      }
    );
  });
}
