import fs from "node:fs";
import { getCurrentPath } from "../lib/path.js";

const { __dirname, __filename } = getCurrentPath(import.meta.url);

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

      await importBackup(backup);

      console.log(chalk.bold.green("Imported successfully!"));
    });
};
