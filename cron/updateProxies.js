const { default: chalk } = require("chalk");
const proxy = require("../lib/proxy");
const db = require("../db/models");

/** Update Proxies */
async function updateProxies() {
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
        { proxy: null },
        {
          where: {
            id: {
              [db.Sequelize.Op.in]: unsubscribedAccounts.map(
                (account) => account.id
              ),
            },
          },
        }
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
      (account) => !sortedProxies.includes(account.proxy)
    );

    if (invalidAccounts.length > 0) {
      /** Available proxies = proxies in working list not currently used by subscribed accounts */
      const availableProxies = sortedProxies.filter(
        (p) => !usedProxies.includes(p)
      );

      /** Assign proxies from available list to invalid accounts */
      invalidAccounts.forEach((account) => {
        const newProxy = availableProxies.shift();
        if (newProxy) {
          account.proxy = newProxy;
        }
      });

      /** Save Accounts */
      await Promise.allSettled(
        invalidAccounts
          .filter((account) => account.proxy)
          .map((account) => account.save())
      );
    }

    console.log(chalk.bold.green("Proxies updated successfully."));
  } catch (error) {
    console.log(chalk.bold.red("Failed to update proxies"));
    console.error(error.message);
  }
}

module.exports = updateProxies;
