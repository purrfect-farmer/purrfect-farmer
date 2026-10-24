import { ACTIVE_FARMER_FIELDS } from "../../services/farmer-activation.js";
import { authSchema } from "../../schemas/member.js";
import isValidUserAgent from "@purrfect/shared/lib/userAgent/isValidUserAgent.js";

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
        name: fastify.app.name,
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
            userAgent: { type: "string" },
          },
        },
      },
    },
    async function (request, reply) {
      const { user } = fastify.utils.getInitDataUnsafe(request.body.initData);

      /** Account fields taken from the sync, a User-Agent only when valid */
      const accountFields = { title: request.body.title, user };

      if (isValidUserAgent(request.body.userAgent)) {
        accountFields.userAgent = request.body.userAgent;
      }

      const farmer = await fastify.db.Farmer.findWithActiveSubscription(
        request.body.farmer,
        user.id,
        false,
      );

      if (farmer) {
        if (farmer.account.subscription) {
          await farmer.account.update(accountFields);
          await farmer.update({
            ...ACTIVE_FARMER_FIELDS,
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
          await account.update(accountFields);
          await account.createFarmer({
            ...ACTIVE_FARMER_FIELDS,
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
