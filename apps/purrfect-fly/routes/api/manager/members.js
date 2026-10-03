import * as dateFns from "date-fns";

import farmers from "../../../farmers/index.js";
import updateProxies from "../../../actions/update-proxies.js";

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
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

  /** Toggle Farming */
  fastify.post(
    "/members/farming",
    {
      schema: {
        body: {
          type: "object",
          required: ["id", "farming"],
          properties: {
            id: { type: "string" },
            farming: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const account = await fastify.db.Account.findByPk(request.body.id);

      if (!account) {
        return reply.badRequest("Account not found!");
      }

      const farming = request.body.farming;

      /** Merge, so the options bag stays open for other keys */
      await account.update({
        options: { ...(account.options || {}), farming },
      });

      /**
       * A pass already under way has to stop: the point of switching farming
       * off is that another server may be using this Telegram session.
       */
      if (!farming) {
        for (const FarmerClass of Object.values(farmers)) {
          FarmerClass.abort(account.id);
        }
      }

      return reply.send({ id: account.id, farming });
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
}
