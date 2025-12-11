const authSchema = {
  body: {
    type: "object",
    required: ["auth"],
    properties: {
      auth: { type: "string" },
    },
  },
};

const farmerSchema = {
  body: {
    type: "object",
    required: ["auth", "id"],
    properties: {
      auth: { type: "string" },
      id: { type: "string" },
    },
  },
};

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {object} opts
 */
export default async function (fastify, opts) {
  /** Get Server */
  fastify.get("/server", async function (request, reply) {
    return {
      name: env("APP_NAME"),
    };
  });

  /** Get Subscription */
  fastify.post(
    "/subscription",
    {
      schema: authSchema,
      preHandler: [fastify.validateWebAppData],
    },
    async function (request, reply) {
      const { user } = request.auth;
      const account = await fastify.db.Account.findWithActiveSubscription(
        user.id,
        false
      );

      const server = {
        name: env("APP_NAME"),
      };

      return { server, account, subscription: account?.subscription };
    }
  );

  /** Get Session */
  fastify.post(
    "/session",
    {
      schema: authSchema,
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

  /** Get Farmers */
  fastify.post(
    "/farmers",
    {
      schema: authSchema,
      preHandler: [fastify.validateWebAppData],
    },
    async function (request, reply) {
      const { user } = request.auth;
      const farmers = await fastify.db.Farmer.findAll({
        where: { accountId: user.id },
      });

      return farmers;
    }
  );

  /** Activate Farmer */
  fastify.post(
    "/farmers/activate",
    {
      schema: farmerSchema,
      preHandler: [fastify.validateWebAppData],
    },
    async function (request, reply) {
      const { user } = request.auth;
      await fastify.db.Farmer.update(
        { active: true },
        {
          where: { id: request.body.id, accountId: user.id },
        }
      );
    }
  );

  /** Deactivate Farmer */
  fastify.post(
    "/farmers/deactivate",
    {
      schema: farmerSchema,
      preHandler: [fastify.validateWebAppData],
    },
    async function (request, reply) {
      const { user } = request.auth;
      await fastify.db.Farmer.destroy({
        where: { id: request.body.id, accountId: user.id },
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
          required: ["farmer", "title", "initData", "headers", "cookies"],
          properties: {
            farmer: { type: "string" },
            title: { type: "string" },
            initData: { type: "string" },
            headers: { type: "object" },
            cookies: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    async function (request, reply) {
      const { user } = fastify.utils.getInitDataUnsafe(request.body.initData);
      const farmer = await fastify.db.Farmer.findWithActiveSubscription(
        request.body.farmer,
        user.id,
        false
      );

      if (farmer) {
        if (farmer.account.subscription) {
          await farmer.account.update({ title: request.body.title, user });
          await farmer.update({
            active: true,
            farmer: request.body.farmer,
            headers: request.body.headers,
            cookies: request.body.cookies || [],
            initData: request.body.initData,
          });
        } else {
          return reply.forbidden("Not allowed!");
        }
      } else {
        const account = await fastify.db.Account.findWithActiveSubscription(
          user.id
        );

        if (account) {
          await account.update({ title: request.body.title, user });
          await account.createFarmer({
            active: true,
            farmer: request.body.farmer,
            headers: request.body.headers,
            cookies: request.body.cookies || [],
            initData: request.body.initData,
          });
        } else {
          return reply.forbidden("Not allowed!");
        }
      }
    }
  );
}
