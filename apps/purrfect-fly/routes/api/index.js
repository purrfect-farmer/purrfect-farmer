import ATFAuto from "../../lib/ATFAuto.js";

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

const atfAutoSchema = {
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
      preHandler: [fastify.validateWebAppData],
    },
    async function (request, reply) {
      const { user } = request.auth;
      const account = await fastify.db.Account.findWithActiveSubscription(
        user.id,
      );

      if (!account) {
        return reply.forbidden("Not allowed!");
      }

      await fastify.db.Farmer.update(
        { status: "active", errorCount: 0 },
        {
          where: { id: request.body.id, accountId: user.id },
        },
      );
    },
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
      const account = await fastify.db.Account.findWithActiveSubscription(
        user.id,
      );

      if (!account) {
        return reply.forbidden("Not allowed!");
      }

      await fastify.db.Farmer.update(
        { status: "inactive" },
        {
          where: { id: request.body.id, accountId: user.id },
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

  /** ATF Auto Boost */
  fastify.post(
    "/atf-auto/boost",
    {
      preHandler: [fastify.validateWebAppData],
      schema: atfAutoSchema,
    },
    async function (request, reply) {
      const { user } = request.auth;
      const account = await fastify.db.Account.findWithActiveSubscription(
        user.id,
      );

      if (!account) {
        return reply.forbidden("Not allowed!");
      }

      ATFAuto.boost({
        ...request.body,
        id: account.id,
      });
    },
  );

  /** ATF Auto Collect */
  fastify.post(
    "/atf-auto/collect",
    {
      preHandler: [fastify.validateWebAppData],
      schema: atfAutoSchema,
    },
    async function (request, reply) {
      const { user } = request.auth;
      const account = await fastify.db.Account.findWithActiveSubscription(
        user.id,
      );

      if (!account) {
        return reply.forbidden("Not allowed!");
      }

      ATFAuto.collect({
        ...request.body,
        id: account.id,
      });
    },
  );

  /** ATF Auto Withdraw */
  fastify.post(
    "/atf-auto/withdraw",
    {
      preHandler: [fastify.validateWebAppData],
      schema: atfAutoSchema,
    },
    async function (request, reply) {
      const { user } = request.auth;
      const account = await fastify.db.Account.findWithActiveSubscription(
        user.id,
      );

      if (!account) {
        return reply.forbidden("Not allowed!");
      }

      ATFAuto.withdraw({
        ...request.body,
        id: account.id,
      });
    },
  );

  /** ATF Auto Status */
  fastify.post(
    "/atf-auto/status",
    {
      preHandler: [fastify.validateWebAppData],
      schema: atfAutoSchema,
    },
    async function (request, reply) {
      const { user } = request.auth;
      const account = await fastify.db.Account.findWithActiveSubscription(
        user.id,
      );

      if (!account) {
        return reply.forbidden("Not allowed!");
      }

      ATFAuto.status({
        ...request.body,
        id: account.id,
      });
    },
  );

  /** ATF Auto Cancel */
  fastify.post(
    "/atf-auto/cancel",
    {
      preHandler: [fastify.validateWebAppData],
      schema: authSchema,
    },
    async function (request, reply) {
      const { user } = request.auth;
      const account = await fastify.db.Account.findWithActiveSubscription(
        user.id,
      );

      if (!account) {
        return reply.forbidden("Not allowed!");
      }

      ATFAuto.cancel({
        id: account.id,
      });
    },
  );

  /** ATF Auto Get Active List */
  fastify.post(
    "/atf-auto/get-active-list",
    {
      preHandler: [fastify.validateWebAppData],
      schema: authSchema,
    },
    async function (request, reply) {
      const { user } = request.auth;
      const account = await fastify.db.Account.findWithActiveSubscription(
        user.id,
      );

      if (!account) {
        return reply.forbidden("Not allowed!");
      }

      const farmers = await fastify.db.Farmer.findAll({
        raw: true,
        attributes: ["accountId"],
        where: {
          farmer: "atf",
          status: "active",
        },
      });

      return farmers.map((item) => item.accountId);
    },
  );
}
