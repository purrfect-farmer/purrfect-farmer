import fp from "fastify-plugin";

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {object} opts
 */
export default fp(async function (fastify, opts) {
  /** Verify JWT */
  fastify.decorate("verifyJWT", async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  /** Verify Subscription */
  fastify.decorate("verifySubscription", async function (request, reply) {
    const { user } = request.auth;
    const account = await fastify.db.Account.findWithActiveSubscription(
      user.id,
    );

    if (!account) {
      return reply.forbidden("Not allowed!");
    }

    request.account = account;
  });
});
