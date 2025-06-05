"use strict";

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {object} opts
 */
module.exports = async function (fastify, opts) {
  /** Get Server */
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
          required: ["auth"],
          properties: {
            auth: { type: "string" },
          },
        },
      },
      preHandler: [fastify.validateWebAppData],
    },
    async function (request, reply) {
      const { user } = request.auth;
      const account = await fastify.db.Account.findWithActiveSubscription(
        user.id,
        false
      );

      return { account, subscription: account.subscription };
    }
  );

  /** Get Session */
  fastify.post(
    "/session",
    {
      schema: {
        body: {
          type: "object",
          required: ["auth"],
          properties: {
            auth: { type: "string" },
          },
        },
      },
      preHandler: [fastify.validateWebAppData],
    },
    async function (request, reply) {
      const { user } = request.auth;
      const account = await fastify.db.Account.findByPk(user.id);

      return reply.send({
        session: account ? account.session : null,
      });
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
