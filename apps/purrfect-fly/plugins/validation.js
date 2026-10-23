import fp from "fastify-plugin";

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {object} opts
 */
export default fp(async function (fastify, opts) {
  fastify.decorate("validateWebAppData", async function (request, reply) {
    try {
      if (!fastify.utils.isValidEd25519InitData(request.body.auth)) {
        return reply.forbidden("Invalid InitData!");
      } else {
        request.auth = fastify.utils.getInitDataUnsafe(request.body.auth);
      }
    } catch (err) {
      return reply.forbidden("Invalid InitData!");
    }
  });
});
