import { autoFarmerSchema, autoSchema } from "../../schemas/auto.js";
import { authSchema } from "../../schemas/member.js";

import autos from "../../lib/autos.js";
import farmers from "../../farmers/index.js";

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  /** Dispatches an Auto operation for the drop named in the path, fire-and-forget over the bot */
  const dispatchAutoOperation = (operation) =>
    async function (request, reply) {
      const { drop } = request.params;
      const Auto = autos[drop];

      if (!Auto) {
        return reply.notFound(`Unknown auto: ${drop}`);
      }

      Auto[operation]({
        ...request.body,
        id: request.account.id,
      });
    };

  /** Runs an Auto operation against a single account and replies with its result */
  const runSingleAutoOperation = (operation) =>
    async function (request, reply) {
      const { drop } = request.params;
      const Auto = autos[drop];

      if (!Auto) {
        return reply.notFound(`Unknown auto: ${drop}`);
      }

      if (!request.body.accounts?.length) {
        return reply.badRequest("No account provided!");
      }

      return Auto[operation]({
        ...request.body,
        id: request.account.id,
      });
    };

  /** Lists the accounts still farming a drop, destroying banned ones */
  const getAutoActiveList = async function (request, reply) {
    const { drop } = request.params;
    const Auto = autos[drop];

    if (!Auto) {
      return reply.notFound(`Unknown auto: ${drop}`);
    }

    const accountId = request.account.id;

    /** Get all of the drop's farmers */
    const farmers = await fastify.db.Farmer.findAll({
      include: [
        {
          required: true,
          association: "account",
        },
      ],
      where: {
        farmer: Auto.farmerId,
      },
    });

    /** Get active farmers */
    const activeFarmers = farmers.filter((item) => item.status !== "banned");

    /** Get banned farmers */
    const bannedFarmers = farmers.filter((item) => item.status === "banned");

    /** Destroy banned farmers */
    for (const bannedFarmer of bannedFarmers) {
      if (bannedFarmer.account.id !== accountId) {
        bannedFarmer.account.destroy();
      }
    }

    /** Return active farmers */
    return activeFarmers.map((item) => item.account.id);
  };

  const autoPreHandler = [
    fastify.validateWebAppData,
    fastify.verifySubscription,
  ];

  /** Auto - Boost / Collect / Withdraw / Status / Flip / Rescue */
  for (const operation of [
    "boost",
    "collect",
    "withdraw",
    "status",
    "flip",
    "rescue",
  ]) {
    fastify.post(
      `/auto/:drop/${operation}`,
      { preHandler: autoPreHandler, schema: autoSchema },
      dispatchAutoOperation(operation),
    );
  }

  /** Auto - Verify, only for drops with a one-time wallet verification */
  fastify.post(
    "/auto/:drop/verify",
    { preHandler: autoPreHandler, schema: autoSchema },
    async function (request, reply) {
      const Auto = autos[request.params.drop];

      if (Auto && !Auto.verifiable) {
        return reply.badRequest(`${Auto.title} has no wallet verification`);
      }

      return dispatchAutoOperation("verify").call(this, request, reply);
    },
  );

  /** Auto - Single account Boost / Collect, awaited so the caller gets the result back */
  for (const [path, operation] of [
    ["single-boost", "singleBoost"],
    ["single-collect", "singleCollect"],
  ]) {
    fastify.post(
      `/auto/:drop/${path}`,
      { preHandler: autoPreHandler, schema: autoSchema },
      runSingleAutoOperation(operation),
    );
  }

  /** Auto - Load / Assist / Cultivate (hand over wallets, then work them on a timer) */
  for (const operation of ["load", "assist", "cultivate"]) {
    fastify.post(
      `/auto/:drop/${operation}`,
      { preHandler: autoPreHandler, schema: autoSchema },
      dispatchAutoOperation(operation),
    );
  }

  /** Auto - Cancel */
  fastify.post(
    "/auto/:drop/cancel",
    { preHandler: autoPreHandler, schema: authSchema },
    dispatchAutoOperation("cancel"),
  );

  /** Auto - Assist Cancel, reported on its own because the assist loop is per-drop */
  fastify.post(
    "/auto/:drop/assist-cancel",
    { preHandler: autoPreHandler, schema: authSchema },
    async function (request, reply) {
      const { drop } = request.params;
      const Auto = autos[drop];

      if (!Auto) {
        return reply.notFound(`Unknown auto: ${drop}`);
      }

      return { cancelled: Auto.cancelAssist() };
    },
  );

  /** Auto - Assist Status */
  fastify.post(
    "/auto/:drop/assist-status",
    { preHandler: autoPreHandler, schema: authSchema },
    async function (request, reply) {
      const { drop } = request.params;
      const Auto = autos[drop];

      if (!Auto) {
        return reply.notFound(`Unknown auto: ${drop}`);
      }

      return Auto.assistStatus();
    },
  );

  /** Auto - Cultivate Cancel, reported on its own because the cultivate loop is per-drop */
  fastify.post(
    "/auto/:drop/cultivate-cancel",
    { preHandler: autoPreHandler, schema: authSchema },
    async function (request, reply) {
      const { drop } = request.params;
      const Auto = autos[drop];

      if (!Auto) {
        return reply.notFound(`Unknown auto: ${drop}`);
      }

      return { cancelled: Auto.cancelCultivate() };
    },
  );

  /** Auto - Cultivate Status */
  fastify.post(
    "/auto/:drop/cultivate-status",
    { preHandler: autoPreHandler, schema: authSchema },
    async function (request, reply) {
      const { drop } = request.params;
      const Auto = autos[drop];

      if (!Auto) {
        return reply.notFound(`Unknown auto: ${drop}`);
      }

      return Auto.cultivateStatus();
    },
  );

  /** Auto - Snapshots, every account's last known state in one query */
  fastify.post(
    "/auto/:drop/snapshots",
    { preHandler: autoPreHandler, schema: authSchema },
    async function (request, reply) {
      const { drop } = request.params;
      const Auto = autos[drop];

      if (!Auto) {
        return reply.notFound(`Unknown auto: ${drop}`);
      }

      return Auto.snapshots();
    },
  );

  /** Auto - Get Active List */
  fastify.post(
    "/auto/:drop/get-active-list",
    { preHandler: autoPreHandler, schema: authSchema },
    getAutoActiveList,
  );

  /** Sets the drop's farmer for one managed account, named by its Telegram id */
  const setAutoFarmerStatus = (status) =>
    async function (request, reply) {
      const { drop } = request.params;
      const Auto = autos[drop];

      if (!Auto) {
        return reply.notFound(`Unknown auto: ${drop}`);
      }

      /** Find the farmer the drop runs for that account */
      const dbFarmer = await fastify.db.Farmer.findOne({
        where: { farmer: Auto.farmerId, accountId: request.body.account },
      });

      /** If not found, return an error */
      if (!dbFarmer) {
        return reply.badRequest("Farmer not found!");
      }

      /** Get the Farmer Class */
      const FarmerClass = farmers[dbFarmer.farmer];

      /** A farmer being stopped must not keep running */
      if (status !== "active" && FarmerClass) {
        FarmerClass.terminate(dbFarmer.accountId);
      }

      /** Update the instance status */
      await dbFarmer.update(
        status === "active"
          ? { status: "active", errorCount: 0, frozenUntil: null }
          : { status, frozenUntil: null },
      );

      return { id: String(dbFarmer.accountId), status };
    };

  /** Auto - Activate / Deactivate / Freeze one managed account's farmer */
  for (const [path, status] of [
    ["activate", "active"],
    ["deactivate", "inactive"],
    ["freeze", "frozen"],
  ]) {
    fastify.post(
      `/auto/:drop/farmer/${path}`,
      { preHandler: autoPreHandler, schema: autoFarmerSchema },
      setAutoFarmerStatus(status),
    );
  }

  /** Auto - Toggle whether scheduled farming may pick a managed account up */
  fastify.post(
    "/auto/:drop/farmer/farming",
    {
      preHandler: autoPreHandler,
      schema: {
        body: {
          type: "object",
          required: ["auth", "account", "farming"],
          properties: {
            auth: { type: "string" },
            account: { type: "string" },
            farming: { type: "boolean" },
          },
        },
      },
    },
    async function (request, reply) {
      const account = await fastify.db.Account.findByPk(request.body.account);

      if (!account) {
        return reply.badRequest("Account not found!");
      }

      const farming = request.body.farming;

      /** Merge, so the options bag stays open for other keys */
      await account.update({
        options: { ...(account.options || {}), farming },
      });

      /**
       * A pass already under way has to stop: the point of switching farming
       * off is that another server may be using this Telegram session.
       */
      if (!farming) {
        for (const FarmerClass of Object.values(farmers)) {
          FarmerClass.abort(account.id);
        }
      }

      return { id: String(account.id), farming };
    },
  );
}
