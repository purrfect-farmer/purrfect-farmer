"use strict";

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {object} opts
 */
module.exports = async function (fastify, opts) {
  fastify.register(require("./auth"));
  fastify.register(require("./telegram"));

  fastify.get("/server", async function (request, reply) {
    return {
      name: process.env.APP_NAME,
    };
  });

  /** Get Subscription */
  fastify.post(
    "/subscription",
    {
      schema: {
        body: {
          type: "object",
          required: ["initData"],
          properties: {
            initData: { type: "string" },
          },
        },
      },
      preHandler: [fastify.validateWebAppData],
    },
    async function (request, reply) {
      const { user } = request.initDataUnsafe;
      const account = await fastify.db.Account.findWithActiveSubscription(
        user.id,
        false
      );

      return { account, subscription: account.subscription };
    }
  );

  /** Sync */
  fastify.post(
    "/sync",
    {
      schema: {
        body: {
          type: "object",
          required: ["farmer", "title", "userId", "initData", "headers"],
          properties: {
            farmer: { type: "string" },
            title: { type: "string" },
            userId: { type: "string" },
            initData: { type: "string" },
            header: { type: "object" },
          },
        },
      },
    },
    async function (request, reply) {
      const { user } = fastify.utils.getInitDataUnsafe(request.body.initData);
      const farmer = await fastify.db.Farmer.findWithActiveSubscription(
        request.body.farmer,
        request.body.userId,
        false
      );

      if (farmer) {
        if (farmer.account.subscription) {
          await farmer.account.update({ title: request.body.title, user });
          await farmer.update({
            active: true,
            farmer: request.body.farmer,
            headers: request.body.headers,
            initData: request.body.initData,
          });
        } else {
          return reply.forbidden("Not allowed!");
        }
      } else {
        const account = await fastify.db.Account.findWithActiveSubscription(
          request.body.userId
        );

        if (account) {
          await account.update({ title: request.body.title, user });
          await account.createFarmer({
            active: true,
            farmer: request.body.farmer,
            headers: request.body.headers,
            initData: request.body.initData,
          });
        } else {
          return reply.forbidden("Not allowed!");
        }
      }
    }
  );
};
