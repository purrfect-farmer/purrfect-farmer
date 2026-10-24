import db from "../../db/models/index.js";
import { parseEnv } from "../../lib/env/parse.js";

/** Keys that cannot change while stored data depends on them */
const ENV_LOCKS = [
  {
    key: "ENCRYPTION_KEY",
    isLocked: async () => (await db.Wallet.count()) > 0,
    message:
      "Encryption key can't change while wallets are stored, they would become unreadable.",
  },
];

/** Errors for each locked key the new content would change */
export async function findLockedChanges(before, after) {
  const current = parseEnv(before);
  const next = parseEnv(after);
  const errors = {};

  for (const lock of ENV_LOCKS) {
    const changed = (current[lock.key] ?? "") !== (next[lock.key] ?? "");

    if (changed && (await lock.isLocked())) {
      errors[lock.key] = [lock.message];
    }
  }

  return errors;
}
