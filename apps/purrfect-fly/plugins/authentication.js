import fp from "fastify-plugin";

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {object} opts
 */
export default fp(async function (fastify, opts) {
  fastify.decorate("verifyJWT", async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
});
