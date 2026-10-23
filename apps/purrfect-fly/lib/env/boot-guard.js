import fs from "node:fs";
import path from "node:path";

/** Boot attempts allowed before a pending env is rolled back */
const MAX_BOOT_ATTEMPTS = 3;

/**
 * Runs before dotenv loads: counts boots of a pending env and rolls it back
 * once it has failed to start too many times
 */
export function runBootGuard({
  envPath,
  pendingPath,
  restoredPath,
  backupsPath,
}) {
  if (!fs.existsSync(pendingPath)) return null;

  try {
    const pending = JSON.parse(fs.readFileSync(pendingPath, "utf-8"));
    pending.attempts = (pending.attempts || 0) + 1;

    if (pending.attempts < MAX_BOOT_ATTEMPTS) {
      fs.writeFileSync(pendingPath, JSON.stringify(pending), "utf-8");
      return null;
    }

    const backup = fs.readFileSync(
      path.join(backupsPath, path.basename(pending.backup)),
      "utf-8",
    );

    fs.writeFileSync(envPath, backup, "utf-8");
    fs.writeFileSync(
      restoredPath,
      JSON.stringify({ backup: pending.backup, restoredAt: new Date() }),
      "utf-8",
    );
    fs.rmSync(pendingPath, { force: true });

    return pending.backup;
  } catch (error) {
    console.error("Env boot guard failed:", error);
    fs.rmSync(pendingPath, { force: true });
    return null;
  }
}
