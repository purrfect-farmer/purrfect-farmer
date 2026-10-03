/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  /** Get Server */
  fastify.get("/server", async function (request, reply) {
    return {
      name: env("APP_NAME"),
    };
  });
}
