import {
  MAX_ACCOUNT_TITLE_LENGTH,
  MAX_ACCOUNT_TITLE_UPDATES,
} from "@purrfect/shared/lib/account/titles.js";
import { naturalCompare } from "@purrfect/shared/lib/naturalCompare.js";
import { updateAccountTitles } from "../../../services/account-titles.js";
import { accountAttributes } from "../../../lib/account-attributes.js";
import { setAccountFarming } from "../../../services/farming.js";
import { subscribeAccount } from "../../../services/subscriptions.js";
import updateProxies from "../../../actions/update-proxies.js";
import { runDatabaseWrite } from "../../../lib/db-write.js";

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
export default async function (fastify) {
  /** Get Members */
  fastify.get("/members", async (request) => {
    const accounts = await fastify.db.Account.findAllWithActiveSubscription({
      required: false,
      attributes: accountAttributes(fastify.app),
    });

    return accounts.sort((a, b) => {
      if (fastify.app.displayAccountTitle) {
        return naturalCompare(a.title || "TGUser", b.title || "TGUser");
      } else {
        return naturalCompare(
          a.user?.username || a.id,
          b.user?.username || b.id,
        );
      }
    });
  });

  /** Update Subscription */
  fastify.post(
    "/members/subscription",
    {
      schema: {
        body: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
            date: { type: "string" },
          },
        },
      },
    },
    async (request) => {
      const ids = request.body.id
        .split(/[,\s]+/)
        .map((s) => Number(s.trim()))
        .filter(Boolean);

      /** One serialized transaction for the whole list */
      await runDatabaseWrite(async (transaction) => {
        for (const id of ids) {
          await subscribeAccount(id, request.body.date, transaction);
        }
      });

      /** Update proxies */
      await updateProxies();
    },
  );

  /** Toggle Farming */
  fastify.post(
    "/members/farming",
    {
      schema: {
        body: {
          type: "object",
          required: ["id", "farming"],
          properties: {
            id: { type: "string" },
            farming: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const account = await fastify.db.Account.findByPk(request.body.id);

      if (!account) {
        return reply.badRequest("Account not found!");
      }

      const farming = request.body.farming;

      await setAccountFarming(account, farming);

      return reply.send({ id: account.id, farming });
    },
  );

  /** Update the titles of many members at once */
  fastify.post(
    "/members/titles",
    {
      schema: {
        body: {
          type: "object",
          required: ["titles"],
          properties: {
            titles: {
              type: "array",
              maxItems: MAX_ACCOUNT_TITLE_UPDATES,
              items: {
                type: "object",
                required: ["id", "title"],
                properties: {
                  id: { type: "integer", minimum: 1 },
                  title: {
                    type: "string",
                    maxLength: MAX_ACCOUNT_TITLE_LENGTH,
                  },
                },
              },
            },
          },
        },
      },
    },
    (request) => updateAccountTitles(request.body.titles),
  );

  /** Kick Member */
  fastify.post(
    "/members/kick",
    {
      schema: {
        body: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    async (request) => {
      const account = await fastify.db.Account.findByPk(request.body.id);
      if (account) {
        /** Destroy Account */
        await account.destroy();
      }
    },
  );

  /** Kick All Members */
  fastify.post("/members/kick/all", async () => {
    const accounts = await fastify.db.Account.findAll();
    for (const account of accounts) {
      /** Destroy Account */
      await account.destroy();
    }
  });
}
