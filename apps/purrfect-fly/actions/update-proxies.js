import app from "../config/app.js";
import chalk from "chalk";
import db from "../db/models/index.js";
import proxy from "../lib/proxy.js";
import { runDatabaseWrite } from "../lib/db-write.js";

/** Update Proxies */
async function updateProxies() {
  if (app.proxy.enabled) {
    try {
      /** Update List */
      console.log(chalk.bold.blue("Updating proxy list..."));
      await proxy.updateList();

      /** Get Working Proxies */
      console.log(chalk.bold.blue("Testing working proxies..."));
      const workingProxies = await proxy.getWorkingProxies();

      /** Sort by duration ascending, extract proxies list */
      const sortedProxies = workingProxies
        .slice()
        .sort((a, b) => a.duration - b.duration)
        .map((item) => item.proxy);

      /** Get unsubscribed accounts with proxy */
      const unsubscribedAccounts = await db.Account.findAll({
        where: {
          proxy: { [db.Sequelize.Op.ne]: null },
          "$subscriptions.id$": { [db.Sequelize.Op.eq]: null },
        },
        include: [
          {
            required: false,
            association: "subscriptions",
            where: { active: true },
          },
        ],
      });

      /** Clear proxies for unsubscribed accounts that currently have proxies */
      if (unsubscribedAccounts.length > 0) {
        await db.Account.update(
          { proxy: "" },
          {
            where: {
              id: {
                [db.Sequelize.Op.in]: unsubscribedAccounts.map(
                  (account) => account.id,
                ),
              },
            },
          },
        );
      }

      /* Get subscribed accounts */
      const accounts = await db.Account.findAllWithActiveSubscription();

      /** Get proxies currently used by subscribed accounts (non-null) */
      const usedProxies = accounts
        .map((account) => account.proxy)
        .filter(Boolean);

      /** Filter accounts that have proxies not in the working list (invalid accounts) */
      const invalidAccounts = accounts.filter(
        (account) => !sortedProxies.includes(account.proxy),
      );

      if (invalidAccounts.length > 0) {
        /** Usage count per working proxy, seeded from accounts that keep theirs */
        const usage = new Map(sortedProxies.map((item) => [item, 0]));

        usedProxies.forEach((item) => {
          if (usage.has(item)) {
            usage.set(item, usage.get(item) + 1);
          }
        });

        /** Assign the least used proxy, reusing from the pool once unused ones run out */
        invalidAccounts.forEach((account) => {
          let picked = "";
          let lowest = Infinity;

          /** Sorted fastest first, so a strict minimum prefers the fastest on ties */
          for (const item of sortedProxies) {
            const count = usage.get(item);

            if (count < lowest) {
              lowest = count;
              picked = item;
            }
          }

          if (picked) {
            usage.set(picked, lowest + 1);
          }

          account.proxy = picked;
        });

        /** Save Accounts, serialized so SQLite never sees concurrent writes */
        await Promise.allSettled(
          invalidAccounts
            .filter((account) => account.changed())
            .map((account) =>
              runDatabaseWrite((transaction) => account.save({ transaction })),
            ),
        );
      }

      console.log(chalk.bold.green("Proxies updated successfully."));
    } catch (error) {
      console.log(chalk.bold.red("Failed to update proxies"));
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating proxies:", error);
      }
    }
  }
}

export default updateProxies;
