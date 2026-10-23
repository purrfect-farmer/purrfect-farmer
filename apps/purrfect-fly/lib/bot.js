import GroupBot from "./bot/GroupBot.js";

const token = env("TELEGRAM_BOT_TOKEN");
const bot = token ? new GroupBot(token) : null;

export default bot;
