/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("test-session <session>")
    .description("Test Session")
    .action(async (session) => {
      const GramClient = await import("../lib/telegram/GramClient.js").then(
        (m) => m.default
      );

      const client = await GramClient.create(session);
      const user = await client.getSelf();
      await client.destroy();

      console.log(user);
    });
};
