import fsp from "node:fs/promises";
import { getEnvPaths } from "./paths.js";
import path from "node:path";
import { runBootGuard } from "./boot-guard.js";

/** Number of env backups to keep */
const MAX_BACKUPS = 10;

/** Env file manager bound to a base path */
export function createEnvStore(basePath) {
  const paths = getEnvPaths(basePath);
  const { envPath, pendingPath, restoredPath, backupsPath } = paths;

  const readEnv = () => fsp.readFile(envPath, "utf-8").catch(() => "");

  /** Copy the current env into a timestamped backup */
  const createBackup = async () => {
    await fsp.mkdir(backupsPath, { recursive: true });

    const name = `${new Date().toISOString().replace(/[:.]/g, "-")}.env`;
    await fsp.writeFile(path.join(backupsPath, name), await readEnv(), "utf-8");

    /** Prune old backups */
    const names = await listBackupNames();
    await Promise.all(
      names
        .slice(MAX_BACKUPS)
        .map((item) => fsp.rm(path.join(backupsPath, item), { force: true })),
    );

    return name;
  };

  /** Backup names, newest first */
  const listBackupNames = async () => {
    const names = await fsp.readdir(backupsPath).catch(() => []);
    return names
      .filter((name) => name.endsWith(".env"))
      .sort()
      .reverse();
  };

  /** Backups with their size and date */
  const listBackups = async () => {
    const names = await listBackupNames();

    return Promise.all(
      names.map(async (name) => {
        const stat = await fsp.stat(path.join(backupsPath, name));
        return { name, size: stat.size, createdAt: stat.mtime };
      }),
    );
  };

  /** Read a backup by name, refusing anything outside the folder */
  const readBackup = async (name) => {
    if (path.basename(name) !== name || !name.endsWith(".env")) {
      throw new Error("Invalid backup name");
    }

    return fsp.readFile(path.join(backupsPath, name), "utf-8");
  };

  /** Back up, write the new env and arm the boot guard */
  const writeEnv = async (content) => {
    const backup = await createBackup();

    await fsp.writeFile(envPath, content, "utf-8");
    await fsp.writeFile(
      pendingPath,
      JSON.stringify({ backup, attempts: 0, createdAt: new Date() }),
      "utf-8",
    );

    return backup;
  };

  /** Called once the server listens: the env is good */
  const confirmBoot = async () => {
    await fsp.rm(pendingPath, { force: true });

    const restored = await fsp
      .readFile(restoredPath, "utf-8")
      .then((content) => JSON.parse(content))
      .catch(() => null);

    if (restored) await fsp.rm(restoredPath, { force: true });

    return restored;
  };

  return {
    envPath,
    readEnv,
    writeEnv,
    listBackups,
    readBackup,
    runBootGuard: () => runBootGuard(paths),
    confirmBoot,
  };
}
