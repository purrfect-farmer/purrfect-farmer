/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  /** Get Server */
  fastify.get("/server", async function () {
    return {
      name: fastify.app.name,
    };
  });
}
