const { default: chalk } = require("chalk");
const proxy = require("../lib/proxy");

/**
 *
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 */
module.exports = (program, inquirer) => {
  program
    .command("generate-jwt-secret")
    .description("Generate JWT Secret")
    .action(async () => {
      const secret = require("crypto").randomBytes(32).toString("hex");

      console.log(chalk.green.bold("Secret"));
      console.log(chalk.blue(secret));
    });
};
