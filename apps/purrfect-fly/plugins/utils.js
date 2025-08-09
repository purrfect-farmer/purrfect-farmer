import fp from "fastify-plugin";

import utils from "../lib/utils.js";

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

export default fp(async function (fastify, opts) {
  fastify.decorate("utils", utils);
});
