import fp from "fastify-plugin";

import appConfig from "../config/app.js";

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

export default fp(async function (fastify, opts) {
  fastify.decorate("app", appConfig);
});
