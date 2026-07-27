import autos from "../../lib/autos.js";

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

const autoSchema = {
  body: {
    type: "object",
    required: ["auth", "password", "master", "accounts"],
    properties: {
      /** Core properties */
      auth: { type: "string" },
      password: { type: "string" },
      master: { type: "object" },
      accounts: { type: "array" },

      /** Configs */
      delay: { type: "number" },
      difference: { type: "number" },
      amount: { type: "string" },
      repeat: { type: "boolean" },
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
        false,
      );

      const server = {
        name: env("APP_NAME"),
      };

      return { server, account, subscription: account?.subscription };
    },
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
    },
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
    },
  );

  /** Activate Farmer */
  fastify.post(
    "/farmers/activate",
    {
      schema: farmerSchema,
      preHandler: [fastify.validateWebAppData, fastify.verifySubscription],
    },
    async function (request, reply) {
      const { account } = request;

      await fastify.db.Farmer.update(
        { status: "active", errorCount: 0 },
        {
          where: { id: request.body.id, accountId: account.id },
        },
      );
    },
  );

  /** Deactivate Farmer */
  fastify.post(
    "/farmers/deactivate",
    {
      schema: farmerSchema,
      preHandler: [fastify.validateWebAppData, fastify.verifySubscription],
    },
    async function (request, reply) {
      const { account } = request;

      await fastify.db.Farmer.update(
        { status: "inactive" },
        {
          where: { id: request.body.id, accountId: account.id },
        },
      );
    },
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
        false,
      );

      if (farmer) {
        if (farmer.account.subscription) {
          await farmer.account.update({ title: request.body.title, user });
          await farmer.update({
            status: "active",
            errorCount: 0,
            farmer: request.body.farmer,
            headers: request.body.headers || {},
            cookies: request.body.cookies || [],
            initData: request.body.initData || "",
          });
        } else {
          return reply.forbidden("Not allowed!");
        }
      } else {
        const account = await fastify.db.Account.findWithActiveSubscription(
          user.id,
        );

        if (account) {
          await account.update({ title: request.body.title, user });
          await account.createFarmer({
            status: "active",
            errorCount: 0,
            farmer: request.body.farmer,
            headers: request.body.headers || {},
            cookies: request.body.cookies || [],
            initData: request.body.initData || "",
            storage: {},
            options: {},
          });
        } else {
          return reply.forbidden("Not allowed!");
        }
      }
    },
  );

  /**
   * Dispatches an Auto operation for the drop named in the path.
   *
   * Operations are fire-and-forget — progress is reported to the user over the
   * Telegram bot, so nothing is awaited here.
   */
  const dispatchAutoOperation = (operation) =>
    async function (request, reply) {
      const { drop } = request.params;
      const Auto = autos[drop];

      if (!Auto) {
        return reply.notFound(`Unknown auto: ${drop}`);
      }

      Auto[operation]({
        ...request.body,
        id: request.account.id,
      });
    };

  /** Lists the accounts still farming a drop, destroying banned ones */
  const getAutoActiveList = async function (request, reply) {
    const { drop } = request.params;
    const Auto = autos[drop];

    if (!Auto) {
      return reply.notFound(`Unknown auto: ${drop}`);
    }

    const accountId = request.account.id;

    /** Get all of the drop's farmers */
    const farmers = await fastify.db.Farmer.findAll({
      include: [
        {
          required: true,
          association: "account",
        },
      ],
      where: {
        farmer: Auto.farmerId,
      },
    });

    /** Get active farmers */
    const activeFarmers = farmers.filter((item) => item.status !== "banned");

    /** Get banned farmers */
    const bannedFarmers = farmers.filter((item) => item.status === "banned");

    /** Destroy banned farmers */
    for (const bannedFarmer of bannedFarmers) {
      if (bannedFarmer.account.id !== accountId) {
        bannedFarmer.account.destroy();
      }
    }

    /** Return active farmers */
    return activeFarmers.map((item) => item.account.id);
  };

  const autoPreHandler = [fastify.validateWebAppData, fastify.verifySubscription];

  /** Auto - Boost / Collect / Withdraw / Status */
  for (const operation of ["boost", "collect", "withdraw", "status"]) {
    fastify.post(
      `/auto/:drop/${operation}`,
      { preHandler: autoPreHandler, schema: autoSchema },
      dispatchAutoOperation(operation),
    );
  }

  /** Auto - Cancel */
  fastify.post(
    "/auto/:drop/cancel",
    { preHandler: autoPreHandler, schema: authSchema },
    dispatchAutoOperation("cancel"),
  );

  /** Auto - Get Active List */
  fastify.post(
    "/auto/:drop/get-active-list",
    { preHandler: autoPreHandler, schema: authSchema },
    getAutoActiveList,
  );
}
