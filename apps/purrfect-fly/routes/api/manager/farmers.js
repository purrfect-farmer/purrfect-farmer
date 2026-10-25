import {
  activateFarmers,
  activateUnfrozenFarmers,
} from "../../../services/farmer-activation.js";
import {
  removeFarmer,
  removeFarmerType,
  setFarmerStatus,
  setFarmerTypeStatus,
} from "../../../services/farmer-status.js";
import { farmerSchema, optionalFarmerSchema } from "../../../schemas/manager.js";

import { FARMER_STATUS } from "../../../enums/farmer-status.js";
import { accountAttributes } from "../../../lib/account-attributes.js";
import farmers from "../../../farmers/index.js";

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  /** Load the farmer named in the body into `request.dbFarmer` */
  const loadFarmer = async function (request, reply) {
    request.dbFarmer = await fastify.db.Farmer.findByPk(request.body.id);

    if (!request.dbFarmer) {
      return reply.badRequest("Farmer not found!");
    }
  };

  /** Get Farmers */
  fastify.get("/farmers", async () => {
    return fastify.db.Account.findAllFarmers({
      attributes: accountAttributes(fastify.app),
    });
  });

  /** Activate All Farmer */
  fastify.post(
    "/farmers/all/activate",
    {
      schema: optionalFarmerSchema,
      /** A missing body means every farmer, so the optional schema still applies */
      preValidation: async (request) => {
        request.body ??= {};
      },
    },
    async (request, reply) => {
      const farmer = request.body?.id;

      /** Scoped to a farmer type, it also unfreezes like the single activate */
      const affectedCount = farmer
        ? await activateFarmers({ farmer })
        : await activateUnfrozenFarmers();

      return reply.send({ success: true, affectedCount });
    },
  );

  /** Disconnect / Freeze All Farmer */
  for (const [path, status] of [
    ["disconnect", FARMER_STATUS.INACTIVE],
    ["freeze", FARMER_STATUS.FROZEN],
  ]) {
    fastify.post(
      `/farmers/all/${path}`,
      { schema: farmerSchema },
      async (request, reply) => {
        const affectedCount = await setFarmerTypeStatus(
          request.body.id,
          status,
        );

        return reply.send({ success: true, affectedCount });
      },
    );
  }

  /** Delete All Farmer */
  fastify.post(
    "/farmers/all/delete",
    { schema: farmerSchema },
    async (request, reply) => {
      const affectedCount = await removeFarmerType(request.body.id);

      return reply.send({ success: true, affectedCount });
    },
  );

  /** Run Farmers */
  fastify.post(
    "/farmers/run",
    { schema: farmerSchema },
    async (request, reply) => {
      farmers[request.body.id]?.run();

      return reply.send({ success: true });
    },
  );

  /** Activate Farmer */
  fastify.post(
    "/farmers/activate",
    { schema: farmerSchema },
    async (request) => {
      await activateFarmers({ id: request.body.id });
    },
  );

  /** Disconnect / Freeze Farmer */
  for (const [path, status] of [
    ["disconnect", FARMER_STATUS.INACTIVE],
    ["freeze", FARMER_STATUS.FROZEN],
  ]) {
    fastify.post(
      `/farmers/${path}`,
      { schema: farmerSchema, preHandler: loadFarmer },
      async (request) => {
        await setFarmerStatus(request.dbFarmer, status);
      },
    );
  }

  /** Delete Farmer */
  fastify.post(
    "/farmers/delete",
    { schema: farmerSchema, preHandler: loadFarmer },
    async (request) => {
      await removeFarmer(request.dbFarmer);
    },
  );
}
