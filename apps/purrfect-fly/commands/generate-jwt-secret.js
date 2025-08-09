import crypto from "crypto";

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("generate-jwt-secret")
    .description("Generate JWT Secret")
    .action(async () => {
      const secret = crypto.randomBytes(32).toString("hex");

      console.log(chalk.green.bold("Secret"));
      console.log(chalk.blue(secret));
    });
};
