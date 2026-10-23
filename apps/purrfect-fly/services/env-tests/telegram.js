import { Bot } from "grammy";
import { check } from "./check.js";
import { fieldsByKey } from "../env-settings/schema.js";

const TEST_MESSAGE = "✅ Purrfect Fly test message";

const THREAD_KEYS = [
  "TELEGRAM_FARMING_THREAD_ID",
  "TELEGRAM_ANNOUNCEMENT_THREAD_ID",
  "TELEGRAM_ERROR_THREAD_ID",
  "TELEGRAM_OPERATIONS_THREAD_ID",
];

/** Send the test message to each configured thread, or the group itself */
async function testGroup(bot, values, results) {
  const threads = THREAD_KEYS.filter((key) => values[key]);

  if (!threads.length) {
    await check(results, "Group chat", async () => {
      await bot.api.sendMessage(values.TELEGRAM_CHAT_ID, TEST_MESSAGE);
      return "Message sent";
    });
    return;
  }

  for (const key of threads) {
    await check(results, fieldsByKey.get(key).label, async () => {
      await bot.api.sendMessage(values.TELEGRAM_CHAT_ID, TEST_MESSAGE, {
        message_thread_id: Number(values[key]),
      });
      return "Message sent";
    });
  }
}

/** Check the bot token, then message the group and the admin */
export default async function testTelegram(values, results) {
  const token = values.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Bot token is empty.");

  const bot = new Bot(token);

  const connected = await check(results, "Bot token", async () => {
    const me = await bot.api.getMe();
    return `Connected as @${me.username}`;
  });

  if (!connected) return;

  if (values.TELEGRAM_CHAT_ID) {
    await testGroup(bot, values, results);
  }

  if (values.SERVER_ADMIN_TELEGRAM_ID) {
    await check(results, "Admin", async () => {
      await bot.api.sendMessage(values.SERVER_ADMIN_TELEGRAM_ID, TEST_MESSAGE);
      return "Message sent";
    });
  }
}
