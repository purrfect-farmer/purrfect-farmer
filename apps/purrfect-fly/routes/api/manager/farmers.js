import { farmerSchema, optionalFarmerSchema } from "../../../schemas/manager.js";

import farmers from "../../../farmers/index.js";

/** Terminate every running instance of a farmer type */
async function terminateAllFarmers(fastify, farmer) {
  const FarmerClass = farmers[farmer];

  if (!FarmerClass) {
    return;
  }

  const dbFarmers = await fastify.db.Farmer.findAll({
    where: { farmer },
    attributes: ["accountId"],
  });

  for (const dbFarmer of dbFarmers) {
    FarmerClass.terminate(dbFarmer.accountId);
  }
}

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  /** Get Farmers */
  fastify.get("/farmers", async (request) => {
    const accounts = await fastify.db.Account.findAllFarmers({
      attributes: {
        exclude: !fastify.app.displayAccountTitle ? ["title"] : [],
      },
    });
    return accounts;
  });

  /** Activate All Farmer */
  fastify.post(
    "/farmers/all/activate",
    { schema: optionalFarmerSchema },
    async (request, reply) => {
      const farmer = request.body?.id;

      /** Scoped to a farmer type, it also unfreezes like the single activate */
      const [affectedCount] = farmer
        ? await fastify.db.Farmer.update(
            { status: "active", errorCount: 0, frozenUntil: null },
            { where: { farmer } },
          )
        : await fastify.db.Farmer.update(
            { status: "active", errorCount: 0 },
            {
              where: {
                status: {
                  [fastify.db.Sequelize.Op.not]: "frozen",
                },
              },
            },
          );

      return reply.send({ success: true, affectedCount });
    },
  );

  /** Disconnect All Farmer */
  fastify.post(
    "/farmers/all/disconnect",
    { schema: farmerSchema },
    async (request, reply) => {
      await terminateAllFarmers(fastify, request.body.id);

      const [affectedCount] = await fastify.db.Farmer.update(
        { status: "inactive", frozenUntil: null },
        { where: { farmer: request.body.id } },
      );

      return reply.send({ success: true, affectedCount });
    },
  );

  /** Freeze All Farmer */
  fastify.post(
    "/farmers/all/freeze",
    { schema: farmerSchema },
    async (request, reply) => {
      await terminateAllFarmers(fastify, request.body.id);

      const [affectedCount] = await fastify.db.Farmer.update(
        { status: "frozen", frozenUntil: null },
        { where: { farmer: request.body.id } },
      );

      return reply.send({ success: true, affectedCount });
    },
  );

  /** Delete All Farmer */
  fastify.post(
    "/farmers/all/delete",
    { schema: farmerSchema },
    async (request, reply) => {
      await terminateAllFarmers(fastify, request.body.id);

      const affectedCount = await fastify.db.Farmer.destroy({
        where: { farmer: request.body.id },
      });

      return reply.send({ success: true, affectedCount });
    },
  );

  /** Run Farmers */
  fastify.post(
    "/farmers/run",
    { schema: farmerSchema },
    async (request, reply) => {
      const FarmerClass = farmers[request.body.id];

      /** Execute */
      if (FarmerClass) {
        FarmerClass.run();
      }

      return reply.send({ success: true });
    },
  );

  /** Activate Farmer */
  fastify.post(
    "/farmers/activate",
    { schema: farmerSchema },
    async (request) => {
      await fastify.db.Farmer.update(
        { status: "active", errorCount: 0, frozenUntil: null },
        { where: { id: request.body.id } },
      );
    },
  );

  /** Disconnect Farmer */
  fastify.post(
    "/farmers/disconnect",
    { schema: farmerSchema },
    async (request, reply) => {
      /* Find the instance */
      const dbFarmer = await fastify.db.Farmer.findByPk(request.body.id);

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
    { schema: farmerSchema },
    async (request, reply) => {
      /* Find the instance */
      const dbFarmer = await fastify.db.Farmer.findByPk(request.body.id);

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
    { schema: farmerSchema },
    async (request, reply) => {
      /* Find the instance */
      const dbFarmer = await fastify.db.Farmer.findByPk(request.body.id);

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
