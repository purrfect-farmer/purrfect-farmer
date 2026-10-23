import path from "node:path";

/** Files the env store keeps under a base path */
export function getEnvPaths(basePath) {
  return {
    envPath: path.resolve(basePath, ".env"),
    pendingPath: path.resolve(basePath, ".env.pending"),
    restoredPath: path.resolve(basePath, ".env.restored"),
    backupsPath: path.resolve(basePath, "backups/env"),
  };
}
