import fs from "node:fs";

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("import-backup <file>")
    .description("Import Backup")
    .usage("/path/to/fly-backup.json")
    .action(async (file) => {
      const backup = JSON.parse(fs.readFileSync(file, "utf-8"));
      const { importBackup } = await import("../lib/backup.js");

      const { envRestored } = await importBackup(backup);

      console.log(chalk.bold.green("Imported successfully!"));

      if (envRestored) {
        console.log(
          chalk.yellow("Restart the server to load the restored settings."),
        );
      }
    });
};
