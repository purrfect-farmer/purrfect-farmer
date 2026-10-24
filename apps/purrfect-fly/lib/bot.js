import GroupBot from "./bot/GroupBot.js";
import { autoRetry } from "@grammyjs/auto-retry";

/** Longest flood wait a send sits out before giving up */
const MAX_RETRY_DELAY_SECONDS = 60;

/** Times a throttled send is retried */
const MAX_RETRY_ATTEMPTS = 3;

const token = env("TELEGRAM_BOT_TOKEN");
const bot = token ? new GroupBot(token) : null;

/** Wait out Telegram's flood limits instead of dropping the message */
bot?.api.config.use(
  autoRetry({
    maxDelaySeconds: MAX_RETRY_DELAY_SECONDS,
    maxRetryAttempts: MAX_RETRY_ATTEMPTS,
  }),
);

export default bot;
