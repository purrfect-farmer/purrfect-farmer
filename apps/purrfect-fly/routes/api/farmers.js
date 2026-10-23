import { removeFarmer, setFarmerStatus } from "../../services/farmer-status.js";
import { activateFarmers } from "../../services/farmer-activation.js";
import { authSchema, farmerSchema } from "../../schemas/member.js";

import { FARMER_STATUS } from "../../enums/farmer-status.js";

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  const farmerRouteOptions = {
    schema: farmerSchema,
    preHandler: [fastify.validateWebAppData, fastify.verifySubscription],
  };

  /** Load the caller's farmer named in the body into `request.dbFarmer` */
  const loadOwnFarmer = async function (request, reply) {
    request.dbFarmer = await fastify.db.Farmer.findOne({
      where: { id: request.body.id, accountId: request.account.id },
    });

    if (!request.dbFarmer) {
      return reply.badRequest("Farmer not found!");
    }
  };

  const ownFarmerRouteOptions = {
    schema: farmerSchema,
    preHandler: [...farmerRouteOptions.preHandler, loadOwnFarmer],
  };

  /** Get Farmers */
  fastify.post(
    "/farmers",
    {
      schema: authSchema,
      preHandler: [fastify.validateWebAppData],
    },
    async function (request) {
      const { user } = request.auth;

      return fastify.db.Farmer.findAll({
        where: { accountId: user.id },
      });
    },
  );

  /** Activate Farmer */
  fastify.post(
    "/farmers/activate",
    farmerRouteOptions,
    async function (request) {
      await activateFarmers({
        id: request.body.id,
        accountId: request.account.id,
      });
    },
  );

  /** Deactivate / Freeze Farmer */
  for (const [path, status] of [
    ["deactivate", FARMER_STATUS.INACTIVE],
    ["freeze", FARMER_STATUS.FROZEN],
  ]) {
    fastify.post(
      `/farmers/${path}`,
      ownFarmerRouteOptions,
      async function (request) {
        await setFarmerStatus(request.dbFarmer, status);
      },
    );
  }

  /** Delete Farmer */
  fastify.post(
    "/farmers/delete",
    ownFarmerRouteOptions,
    async function (request) {
      await removeFarmer(request.dbFarmer);
    },
  );
}
