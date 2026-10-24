import { getSessionPath, getSessions } from "./telegram/session-store.js";
import app from "../config/app.js";
import { applyChanges } from "./env/edit.js";
import db from "../db/models/index.js";
import { formatDate } from "date-fns";
import fs from "node:fs";
import { getCurrentPath } from "./path.js";
import { parseEnv } from "./env/parse.js";
import path from "node:path";
import { runDatabaseWrite } from "./db-write.js";

const { __dirname } = getCurrentPath(import.meta.url);
const ENV_FILE = app.envPath;

/** Keys that belong to this instance, kept from its own .env when a backup is restored */
const INSTANCE_ENV_KEYS = ["PORT", "PM2_APP_NAME", "APP_NAME"];

/** The backup's env with this instance's own keys kept as they are, or left out when unset */
function keepInstanceEnv(restoredEnv) {
  const currentEnv = fs.existsSync(ENV_FILE)
    ? fs.readFileSync(ENV_FILE, "utf-8")
    : "";
  const current = parseEnv(currentEnv);
  const changes = Object.fromEntries(
    INSTANCE_ENV_KEYS.map((key) => [key, current[key] ?? null]),
  );

  return applyChanges(restoredEnv, changes);
}

/** Tables in restore order, each with its key in the backup */
const TABLES = [
  ["User", "users"],
  ["Account", "accounts"],
  ["Payment", "payments"],
  ["Subscription", "subscriptions"],
  ["Farmer", "farmers"],
  ["Wallet", "wallets"],
];

export async function importBackup(backup) {
  /** Tables the backup carries, an older backup leaves the newer tables untouched */
  const tables = TABLES.filter(([, key]) => Array.isArray(backup[key]));

  /** Replace every table in one transaction, so a failed restore keeps the old data */
  await runDatabaseWrite(async (transaction) => {
    for (const [model] of tables) {
      await db[model].truncate({ transaction });
    }

    for (const [model, key] of tables) {
      await db[model].bulkCreate(backup[key], {
        ignoreDuplicates: true,
        transaction,
      });
    }
  });

  /** Restore Sessions */
  backup.sessions.forEach((session) => {
    fs.writeFileSync(
      path.resolve(__dirname, "../sessions", path.basename(session.name)),
      session.content,
    );
  });

  /** Restore .env */
  if (backup.env) {
    fs.writeFileSync(ENV_FILE, keepInstanceEnv(backup.env));
  }
}

export async function exportBackup() {
  const env = fs.readFileSync(ENV_FILE, "utf-8");
  const [
    users,
    accounts,
    payments,
    subscriptions,
    farmers,
    wallets,
    telegramSessions,
  ] = await Promise.all([
    db.User.findAll(),
    db.Account.findAll(),
    db.Payment.findAll(),
    db.Subscription.findAll(),
    db.Farmer.findAll(),
    db.Wallet.findAll(),
    getSessions(),
  ]);

  const sessions = [];

  for (const session of telegramSessions) {
    const filePath = getSessionPath(session);
    const name = path.basename(filePath);
    const content = fs.readFileSync(filePath, "utf-8");

    sessions.push({
      name,
      content,
    });
  }

  return {
    filename: `fly-backup-${formatDate(new Date(), "yyyyMMdd-HHmmss")}.json`,
    data: {
      env,
      users,
      accounts,
      payments,
      subscriptions,
      farmers,
      wallets,
      sessions,
    },
  };
}
