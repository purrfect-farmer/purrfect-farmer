"use strict";

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {object} opts
 */
module.exports = async function (fastify, opts) {
  fastify.post(
    "/session",
    {
      schema: {
        body: {
          type: "object",
          required: ["initData"],
          properties: {
            initData: { type: "string" },
          },
        },
      },
      preHandler: [fastify.validateWebAppData],
    },
    async function (request, reply) {
      const { user } = request.initDataUnsafe;
      const account = await fastify.db.Account.findByPk(user.id);

      return reply.send({
        session: account ? account.session : null,
      });
    }
  );
};
