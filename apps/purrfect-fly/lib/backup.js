import GramClient from "./GramClient.js";
import db from "../db/models/index.js";
import { formatDate } from "date-fns";
import fs from "node:fs";
import { getCurrentPath } from "./path.js";
import path from "node:path";

const { __dirname, __filename } = getCurrentPath(import.meta.url);
const ENV_FILE = path.join(__dirname, "../.env");

export async function importBackup(backup) {
  await db.User.bulkCreate(backup.users, { ignoreDuplicates: true });
  await db.Account.bulkCreate(backup.accounts, { ignoreDuplicates: true });
  await db.Payment.bulkCreate(backup.payments, { ignoreDuplicates: true });
  await db.Subscription.bulkCreate(backup.subscriptions, {
    ignoreDuplicates: true,
  });
  await db.Farmer.bulkCreate(backup.farmers, { ignoreDuplicates: true });

  /** Restore Sessions */
  backup.sessions.forEach((session) => {
    fs.writeFileSync(
      path.resolve(__dirname, "../sessions", session.name),
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
  const users = await db.User.findAll();
  const accounts = await db.Account.findAll();
  const payments = await db.Payment.findAll();
  const subscriptions = await db.Subscription.findAll();
  const farmers = await db.Farmer.findAll();
  const telegramSessions = await GramClient.getSessions();

  const sessions = [];

  for (const session of telegramSessions) {
    const filePath = GramClient.getSessionPath(session);
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
