import { authSchema, farmerSchema } from "../../schemas/member.js";

import farmers from "../../farmers/index.js";

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  const farmerRouteOptions = {
    schema: farmerSchema,
    preHandler: [fastify.validateWebAppData, fastify.verifySubscription],
  };

  /** Get Farmers */
  fastify.post(
    "/farmers",
    {
      schema: authSchema,
      preHandler: [fastify.validateWebAppData],
    },
    async function (request, reply) {
      const { user } = request.auth;
      const farmers = await fastify.db.Farmer.findAll({
        where: { accountId: user.id },
      });

      return farmers;
    },
  );

  /** Activate Farmer */
  fastify.post(
    "/farmers/activate",
    farmerRouteOptions,
    async function (request, reply) {
      const { account } = request;

      await fastify.db.Farmer.update(
        { status: "active", errorCount: 0, frozenUntil: null },
        {
          where: { id: request.body.id, accountId: account.id },
        },
      );
    },
  );

  /** Deactivate Farmer */
  fastify.post(
    "/farmers/deactivate",
    farmerRouteOptions,
    async function (request, reply) {
      const { account } = request;

      /** Find the farmer */
      const dbFarmer = await fastify.db.Farmer.findOne({
        where: { id: request.body.id, accountId: account.id },
      });

      /** If not found, return an error */
      if (!dbFarmer) {
        return reply.badRequest("Farmer not found!");
      }

      /** Get the Farmer Class */
      const FarmerClass = farmers[dbFarmer.farmer];

      /** Terminate the instance */
      if (FarmerClass) {
        FarmerClass.terminate(dbFarmer.accountId);
      }

      /** Update the instance status */
      await dbFarmer.update({ status: "inactive", frozenUntil: null });
    },
  );

  /** Freeze Farmer */
  fastify.post(
    "/farmers/freeze",
    farmerRouteOptions,
    async function (request, reply) {
      const { account } = request;

      /** Find the farmer */
      const dbFarmer = await fastify.db.Farmer.findOne({
        where: { id: request.body.id, accountId: account.id },
      });

      /** If not found, return an error */
      if (!dbFarmer) {
        return reply.badRequest("Farmer not found!");
      }

      /** Get the Farmer Class */
      const FarmerClass = farmers[dbFarmer.farmer];

      /** Terminate the instance */
      if (FarmerClass) {
        FarmerClass.terminate(dbFarmer.accountId);
      }

      /** Update the instance status */
      await dbFarmer.update({ status: "frozen", frozenUntil: null });
    },
  );

  /** Delete Farmer */
  fastify.post(
    "/farmers/delete",
    farmerRouteOptions,
    async function (request, reply) {
      const { account } = request;

      /** Find the farmer */
      const dbFarmer = await fastify.db.Farmer.findOne({
        where: { id: request.body.id, accountId: account.id },
      });

      /** If not found, return an error */
      if (!dbFarmer) {
        return reply.badRequest("Farmer not found!");
      }

      /** Get the Farmer Class */
      const FarmerClass = farmers[dbFarmer.farmer];

      /** Terminate the instance */
      if (FarmerClass) {
        FarmerClass.terminate(dbFarmer.accountId);
      }

      /** Delete the instance */
      await dbFarmer.destroy();
    },
  );
}
