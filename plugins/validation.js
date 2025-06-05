"use strict";

const fp = require("fastify-plugin");

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

/**
 * @param {import("fastify").FastifyInstance} fastify
 * @param {object} opts
 */
module.exports = fp(async function (fastify, opts) {
  fastify.decorate("validateWebAppData", async function (request, reply) {
    if (!fastify.utils.isValidEd25519InitData(request.body.initData)) {
      return reply.forbidden("Invalid InitData!");
    } else {
      request.initDataUnsafe = fastify.utils.getInitDataUnsafe(
        request.body.initData
      );
    }
  });
});
