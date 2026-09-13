import crypto from "crypto";
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
export default async function (fastify, opts) {
  /**
   * Bind a freshly authenticated session to its account.
   *
   * Accounts without an active subscription are logged straight back out, so
   * every authenticating route funnels through here.
   */
  const bindAccount = async (client, session, result, reply) => {
    if (result.user) {
      const account = await fastify.db.Account.findWithActiveSubscription(
        Number(result.user.id),
      );

      if (account) {
        await account.update({ session });
      } else {
        await client.logout();
        return reply.forbidden("Not allowed!");
      }
    }

    return result;
  };

  fastify
    // Login with Phone
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
      },
    )

    // Verify Code
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
          request.body.session,
        );

        /** Send Phone Code */
        const result = await client.startResponse("code", request.body.code);

        return bindAccount(client, request.body.session, result, reply);
      },
    )

    // Verify 2FA Password
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
          request.body.session,
        );

        /** Send Password */
        const result = await client.startResponse(
          "password",
          request.body.password,
        );

        return bindAccount(client, request.body.session, result, reply);
      },
    )

    /**
     * Login with an exported login token.
     */
    .post("/login-token", async function (request, reply) {
      /** Generate Session ID */
      const session = crypto.randomBytes(8).toString("hex");

      /** Create Client */
      const client = await fastify.lib.GramClient.create(session);

      /** Start Pending */
      const result = await client.startTokenPending();

      /** Return Response */
      return { ...result, session };
    })

    // Confirm the Login Token was accepted
    .post(
      "/login-token/confirm",
      {
        schema: {
          body: {
            type: "object",
            required: ["session"],
            properties: {
              session: sessionSchema,
            },
          },
        },
      },
      async function (request, reply) {
        /** Create Client */
        const client = await fastify.lib.GramClient.create(
          request.body.session,
        );

        /** Report the Acceptance */
        const result = await client.startResponse("token", true);

        return bindAccount(client, request.body.session, result, reply);
      },
    )

    // Logout
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
          false,
        );

        if (account?.session) {
          try {
            /** Create Client */
            const client = await fastify.lib.GramClient.create(account.session);

            /** Connect */
            await client.connect();

            /** Logout */
            await client.logout();
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              console.error("Error logging out account:", error);
            }
          } finally {
            await account.update({ session: null });
          }
        }

        return {
          result: true,
        };
      },
    );
}
