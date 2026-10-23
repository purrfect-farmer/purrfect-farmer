import GramClient from "../lib/GramClient.js";
import appConfig from "../config/app.js";
import fp from "fastify-plugin";
import models from "../db/models/index.js";
import utils from "../lib/utils.js";

/** Shares config, models and helpers with every route */
export default fp(async function (fastify) {
  fastify.decorate("app", appConfig);
  fastify.decorate("db", models);
  fastify.decorate("lib", { GramClient });
  fastify.decorate("utils", utils);
});
