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

  /** Every manager route needs a manager JWT unless it sets `config.public` */
  fastify.addHook("onRoute", (routeOptions) => {
    if (!routeOptions.url.startsWith("/api/manager/")) return;
    if (routeOptions.config?.public) return;

    routeOptions.onRequest = [
      fastify.verifyJWT,
      ...[].concat(routeOptions.onRequest || []),
    ];
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
