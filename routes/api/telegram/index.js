"use strict";
const crypto = require("crypto");

/** Session Schema */
const sessionSchema = {
  type: "string",
  pattern: "^[a-z0-9]{16}$",
};

/** Phone Schema */
const phoneSchema = {
  type: "string",
  pattern: "^\\+?[1-9]\\d{7,14}$",
};

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {object} opts
 */
module.exports = async function (fastify, opts) {
  fastify
    .post(
      "/login",
      {
        schema: {
          body: {
            type: "object",
            required: ["phone"],
            properties: {
              phone: phoneSchema,
            },
          },
        },
      },
      async function (request, reply) {
        /** Generate Session ID */
        const session = crypto.randomBytes(8).toString("hex");

        /** Create Client */
        const client = await fastify.lib.GramClient.create(session);

        /** Start Pending */
        await client.startPending();

        /** Send Phone Number */
        const result = await client.startResponse("phone", request.body.phone);

        /** Return Response */
        return { ...result, session };
      }
    )
    .post(
      "/code",
      {
        schema: {
          body: {
            type: "object",
            required: ["session", "code"],
            properties: {
              session: sessionSchema,
              code: { type: "string" },
            },
          },
        },
      },
      async function (request, reply) {
        /** Create Client */
        const client = await fastify.lib.GramClient.create(
          request.body.session
        );

        /** Send Phone Code */
        const result = await client.startResponse("code", request.body.code);

        if (result.user) {
          const account = await fastify.db.Account.findWithActiveSubscription(
            Number(result.user.id)
          );

          if (account) {
            await account.update({
              session: request.body.session,
            });
          } else {
            await client.logout();
            return reply.forbidden("Not allowed!");
          }
        }

        return result;
      }
    )
    .post(
      "/password",
      {
        schema: {
          body: {
            type: "object",
            required: ["session", "password"],
            properties: {
              session: sessionSchema,
              password: { type: "string" },
            },
          },
        },
      },
      async function (request, reply) {
        /** Create Client */
        const client = await fastify.lib.GramClient.create(
          request.body.session
        );

        /** Send Password */
        const result = await client.startResponse(
          "password",
          request.body.password
        );

        if (result.user) {
          const account = await fastify.db.Account.findWithActiveSubscription(
            Number(result.user.id)
          );

          if (account) {
            await account.update({
              session: request.body.session,
            });
          } else {
            await client.logout();
            return reply.forbidden("Not allowed!");
          }
        }

        return result;
      }
    )
    .post(
      "/logout",
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
          Number(user.id),
          false
        );

        if (account?.session) {
          try {
            /** Create Client */
            const client = await fastify.lib.GramClient.create(account.session);

            /** Connect */
            await client.connect();

            /** Logout */
            await client.logout();
          } catch (e) {
            console.error(e);
          } finally {
            await account.update({ session: null });
          }
        }

        return {
          result: true,
        };
      }
    );
};
