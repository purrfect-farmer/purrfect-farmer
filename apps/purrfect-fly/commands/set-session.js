import crypto from "crypto";

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("set-session [user]")
    .description("Set session for a user")
    .usage("12345678")
    .action(async (userId) => {
      const db = await import("../db/models/index.js").then((m) => m.default);
      const GramClient = await import("../lib/GramClient.js").then(
        (m) => m.default
      );

      if (!userId) {
        const answers = await inquirer.prompt([
          { name: "userId", message: "Telegram User ID:", required: true },
        ]);

        userId = answers.userId;
      }

      /** Get session string */
      const { sessionString } = await inquirer.prompt([
        { name: "session", message: "Session:", required: true },
      ]);

      /** Find or create account */
      const [account] = await db.Account.findOrCreate({
        where: {
          id: userId,
        },
      });

      /** Write session string */
      const session = crypto.randomBytes(8).toString("hex");
      await GramClient.writeSession(session, sessionString);

      /** Update account */
      await account.update({
        session,
      });
    });
};
