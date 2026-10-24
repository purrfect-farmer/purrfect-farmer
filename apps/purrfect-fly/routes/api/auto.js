import {
  WalletDecryptionError,
  pushAutoWallets,
} from "../../services/wallets/push-auto-wallets.js";
import {
  autoFarmerSchema,
  autoSchema,
  autoWalletsPushSchema,
  autoWalletsRemovalSchema,
} from "../../schemas/auto.js";

import { AUTO_OPERATION } from "../../enums/auto-operation.js";
import { FARMER_STATUS } from "../../enums/farmer-status.js";
import { WalletPushError } from "../../services/wallets/auto-wallet-entries.js";
import { authSchema } from "../../schemas/member.js";
import autos from "../../lib/autos.js";
import { setAccountFarming } from "../../services/farming.js";
import { removeAutoWallets } from "../../services/wallets/remove-auto-wallets.js";
import serverCipher from "../../lib/ServerCipher.js";
import { setFarmerStatus } from "../../services/farmer-status.js";

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  /** Resolve the drop named in the path into `request.auto` */
  const resolveAuto = async function (request, reply) {
    const { drop } = request.params;

    request.auto = autos[drop];

    if (!request.auto) {
      return reply.notFound(`Unknown auto: ${drop}`);
    }
  };

  /** Dispatches an Auto operation for the drop named in the path, fire-and-forget over the bot */
  const dispatchAutoOperation = (operation) =>
    async function (request) {
      request.auto[operation]({
        ...request.body,
        id: request.account.id,
      });
    };

  /** Runs an Auto operation against a single account and replies with its result */
  const runSingleAutoOperation = (operation) =>
    async function (request, reply) {
      if (!request.body.accounts?.length) {
        return reply.badRequest("No account provided!");
      }

      return request.auto[operation]({
        ...request.body,
        id: request.account.id,
      });
    };

  /** Lists the accounts still farming a drop, destroying banned ones */
  const getAutoActiveList = async function (request) {
    const Auto = request.auto;
    const accountId = request.account.id;

    /** Get all of the drop's farmers */
    const farmers = await fastify.db.Farmer.findAll({
      attributes: ["id", "accountId", "status"],
      include: [
        {
          required: true,
          association: "account",
          /** Destroying an account logs its session out */
          attributes: ["id", "session"],
        },
      ],
      where: {
        farmer: Auto.farmerId,
      },
    });

    /** Get active farmers */
    const activeFarmers = farmers.filter(
      (item) => item.status !== FARMER_STATUS.BANNED,
    );

    /** Get banned farmers */
    const bannedFarmers = farmers.filter(
      (item) => item.status === FARMER_STATUS.BANNED,
    );

    /** Destroy banned farmers */
    for (const bannedFarmer of bannedFarmers) {
      if (bannedFarmer.account.id !== accountId) {
        bannedFarmer.account.destroy();
      }
    }

    /** Return active farmers */
    return activeFarmers.map((item) => item.account.id);
  };

  const memberPreHandler = [
    fastify.validateWebAppData,
    fastify.verifySubscription,
  ];

  const autoPreHandler = [...memberPreHandler, resolveAuto];

  /** Auto - Boost / Collect / Withdraw / Status / Flip / Rescue */
  for (const operation of [
    AUTO_OPERATION.BOOST,
    AUTO_OPERATION.COLLECT,
    AUTO_OPERATION.WITHDRAW,
    AUTO_OPERATION.STATUS,
    AUTO_OPERATION.FLIP,
    AUTO_OPERATION.RESCUE,
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
      const Auto = request.auto;

      if (!Auto.verifiable) {
        return reply.badRequest(`${Auto.title} has no wallet verification`);
      }

      return dispatchAutoOperation(AUTO_OPERATION.VERIFY).call(
        this,
        request,
        reply,
      );
    },
  );

  /** Auto - Swap every account's TON into the jetton, which a native drop does not have */
  fastify.post(
    "/auto/:drop/swap",
    { preHandler: autoPreHandler, schema: autoSchema },
    async function (request, reply) {
      const Auto = request.auto;

      if (Auto.native) {
        return reply.badRequest(`${Auto.title} has no jetton to swap into`);
      }

      return dispatchAutoOperation(AUTO_OPERATION.SWAP).call(
        this,
        request,
        reply,
      );
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
  for (const operation of [AUTO_OPERATION.LOAD, "assist", "cultivate"]) {
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
    async function (request) {
      return { cancelled: request.auto.cancelAssist() };
    },
  );

  /** Auto - Assist Status */
  fastify.post(
    "/auto/:drop/assist-status",
    { preHandler: autoPreHandler, schema: authSchema },
    async function (request) {
      return request.auto.assistStatus();
    },
  );

  /** Auto - Cultivate Cancel, reported on its own because the cultivate loop is per-drop */
  fastify.post(
    "/auto/:drop/cultivate-cancel",
    { preHandler: autoPreHandler, schema: authSchema },
    async function (request) {
      return { cancelled: request.auto.cancelCultivate() };
    },
  );

  /** Auto - Cultivate Status */
  fastify.post(
    "/auto/:drop/cultivate-status",
    { preHandler: autoPreHandler, schema: authSchema },
    async function (request) {
      return request.auto.cultivateStatus();
    },
  );

  /** Auto - Snapshots, every account's last known state in one query */
  fastify.post(
    "/auto/:drop/snapshots",
    { preHandler: autoPreHandler, schema: authSchema },
    async function (request) {
      return request.auto.snapshots();
    },
  );

  /** Auto - Push Wallets, stored under the server's encryption key */
  fastify.post(
    "/auto/:drop/push-wallets",
    { preHandler: autoPreHandler, schema: autoWalletsPushSchema },
    async function (request, reply) {
      if (!serverCipher.isAvailable()) {
        return reply.serviceUnavailable("Server encryption key is not set");
      }

      const { password, master, accounts, pushScope } = request.body;

      try {
        return await pushAutoWallets({
          title: request.auto.title,
          ownerId: request.account.id,
          drop: request.auto.id,
          password,
          master,
          accounts,
          pushScope,
        });
      } catch (error) {
        if (
          error instanceof WalletPushError ||
          error instanceof WalletDecryptionError
        ) {
          return reply.badRequest(error.message);
        }

        throw error;
      }
    },
  );

  /** Auto - Remove Wallets a rotation replaced */
  fastify.post(
    "/auto/:drop/remove-wallets",
    { preHandler: autoPreHandler, schema: autoWalletsRemovalSchema },
    async function (request) {
      return removeAutoWallets({
        ownerId: request.account.id,
        drop: request.auto.id,
        wallets: request.body.wallets,
      });
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
      /** The farmer the drop runs for that account */
      const dbFarmer = await fastify.db.Farmer.findOne({
        where: {
          farmer: request.auto.farmerId,
          accountId: request.body.account,
        },
      });

      if (!dbFarmer) {
        return reply.badRequest("Farmer not found!");
      }

      await setFarmerStatus(dbFarmer, status);

      return { id: String(dbFarmer.accountId), status };
    };

  /** Auto - Activate / Deactivate / Freeze one managed account's farmer */
  for (const [path, status] of [
    ["activate", FARMER_STATUS.ACTIVE],
    ["deactivate", FARMER_STATUS.INACTIVE],
    ["freeze", FARMER_STATUS.FROZEN],
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
      preHandler: memberPreHandler,
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

      await setAccountFarming(account, farming);

      return { id: String(account.id), farming };
    },
  );
}
