/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
module.exports = (program, inquirer, chalk) => {
  program
    .command("test-session <session>")
    .description("Test Session")
    .action(async (session) => {
      const GramClient = require("../lib/GramClient");
      const client = await GramClient.create(session);
      const user = await client.getSelf();
      await client.destroy();

      console.log(user);
    });
};
