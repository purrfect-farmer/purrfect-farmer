import { getSessionPath, getSessions } from "./telegram/session-store.js";
import app from "../config/app.js";
import db from "../db/models/index.js";
import { formatDate } from "date-fns";
import fs from "node:fs";
import { getCurrentPath } from "./path.js";
import path from "node:path";
import { runDatabaseWrite } from "./db-write.js";

const { __dirname } = getCurrentPath(import.meta.url);
const ENV_FILE = app.envPath;

/** Tables in restore order, each with its key in the backup */
const TABLES = [
  ["User", "users"],
  ["Account", "accounts"],
  ["Payment", "payments"],
  ["Subscription", "subscriptions"],
  ["Farmer", "farmers"],
];

export async function importBackup(backup) {
  /** Replace every table in one transaction, so a failed restore keeps the old data */
  await runDatabaseWrite(async (transaction) => {
    for (const [model] of TABLES) {
      await db[model].truncate({ transaction });
    }

    for (const [model, key] of TABLES) {
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
    fs.writeFileSync(ENV_FILE, backup.env);
  }
}

export async function exportBackup() {
  const env = fs.readFileSync(ENV_FILE, "utf-8");
  const [users, accounts, payments, subscriptions, farmers, telegramSessions] =
    await Promise.all([
      db.User.findAll(),
      db.Account.findAll(),
      db.Payment.findAll(),
      db.Subscription.findAll(),
      db.Farmer.findAll(),
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
      sessions,
    },
  };
}
