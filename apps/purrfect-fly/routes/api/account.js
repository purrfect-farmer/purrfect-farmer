import { authSchema } from "../../schemas/member.js";

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
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
            frozenUntil: null,
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
            frozenUntil: null,
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
}
