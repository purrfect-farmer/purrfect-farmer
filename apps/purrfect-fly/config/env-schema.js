import { Cron } from "croner";
import { CAPTCHA_PROVIDERS } from "@purrfect/shared/lib/captcha/providers.js";

/** Settings groups shown in the manager */
export const ENV_GROUPS = [
  {
    id: "general",
    title: "General",
    description: "Server name, login security and your main account.",
  },
  {
    id: "telegram",
    title: "Telegram",
    description: "Bot and group used for farming reports.",
    test: "telegram",
  },
  {
    id: "captcha",
    title: "Captcha",
    description: "Service that solves captchas for farmers.",
    test: "captcha",
  },
  {
    id: "proxy",
    title: "Proxy",
    description: "Proxies given to subscribed members.",
    test: "proxy",
  },
  {
    id: "seeker",
    title: "Seeker",
    description: "Reports this server's address to a Seeker server.",
    test: "seeker",
  },
  {
    id: "cron",
    title: "Schedule",
    description: "Background jobs and which farmers may run.",
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Tuning knobs. Leave these alone unless you know why.",
  },
];

/** Known server keys */
export const ENV_FIELDS = [
  /** General */
  {
    key: "APP_NAME",
    group: "general",
    label: "Server name",
    type: "string",
    default: "",
    help: "Shown in Telegram messages and on the Seeker server.",
  },
  {
    key: "JWT_SECRET_KEY",
    group: "general",
    label: "Login secret",
    type: "secret",
    required: true,
    generate: true,
    warning: "Changing this logs everyone out of the manager.",
    help: "Random text used to sign manager logins. Use Generate if unsure.",
  },
  {
    key: "PRIMARY_ACCOUNT_ID",
    group: "general",
    label: "Primary account ID",
    type: "telegramId",
    required: true,
    help: "Your Telegram user ID. Farmers use its referral link.",
  },
  {
    key: "DISPLAY_ACCOUNT_TITLE",
    group: "general",
    label: "Show account names",
    type: "boolean",
    default: false,
    help: "Show account names in messages and the manager.",
  },

  /** Telegram */
  {
    key: "TELEGRAM_BOT_TOKEN",
    group: "telegram",
    label: "Bot token",
    type: "secret",
    format: "botToken",
    help: "From @BotFather, looks like 123456:ABC-DEF...",
  },
  {
    key: "TELEGRAM_CHAT_ID",
    group: "telegram",
    label: "Group chat ID",
    type: "chatId",
    help: "Starts with -100. Add the bot to the group as admin.",
  },
  {
    key: "TELEGRAM_FARMING_THREAD_ID",
    group: "telegram",
    label: "Farming topic ID",
    type: "threadId",
    help: "Topic for farming reports. Leave empty if the group has no topics.",
  },
  {
    key: "TELEGRAM_ANNOUNCEMENT_THREAD_ID",
    group: "telegram",
    label: "Announcement topic ID",
    type: "threadId",
  },
  {
    key: "TELEGRAM_ERROR_THREAD_ID",
    group: "telegram",
    label: "Error topic ID",
    type: "threadId",
  },
  {
    key: "TELEGRAM_OPERATIONS_THREAD_ID",
    group: "telegram",
    label: "Operations topic ID",
    type: "threadId",
  },
  {
    key: "SERVER_ADMIN_TELEGRAM_ID",
    group: "telegram",
    label: "Admin Telegram ID",
    type: "telegramId",
    help: "Receives private server notices. Start a chat with the bot first.",
  },
  {
    key: "DISABLE_TELEGRAM_MESSAGES",
    group: "telegram",
    label: "Disable Telegram messages",
    type: "boolean",
    default: false,
  },
  {
    key: "STARTUP_SEND_SERVER_ADDRESS",
    group: "telegram",
    label: "Send server address on startup",
    type: "boolean",
    default: true,
  },

  /** Captcha */
  {
    key: "CAPTCHA_PROVIDER",
    group: "captcha",
    label: "Provider",
    type: "enum",
    default: "2captcha",
    options: CAPTCHA_PROVIDERS.map((provider) => provider.id),
  },
  {
    key: "CAPTCHA_API_KEY",
    group: "captcha",
    label: "API key",
    type: "secret",
  },

  /** Proxy */
  {
    key: "PROXY_ENABLED",
    group: "proxy",
    label: "Enable proxies",
    type: "boolean",
    default: false,
  },
  {
    key: "PROXY_PROVIDER",
    group: "proxy",
    label: "Provider",
    type: "enum",
    default: "webshare",
    options: ["webshare", "floxy", "iplocate"],
  },
  {
    key: "PROXY_API_KEY",
    group: "proxy",
    label: "API key",
    type: "secret",
    help: "Not needed for iplocate.",
  },
  {
    key: "PROXY_PLAN_ID",
    group: "proxy",
    label: "Plan ID",
    type: "string",
    help: "Floxy only. Leave empty to pick the first datacenter plan.",
  },
  {
    key: "PROXY_PAGE",
    group: "proxy",
    label: "Page",
    type: "number",
    default: 1,
    min: 1,
  },
  {
    key: "PROXY_PAGE_SIZE",
    group: "proxy",
    label: "Page size",
    type: "number",
    default: 100,
    min: 1,
    max: 1000,
  },

  /** Seeker */
  {
    key: "SEEKER_ENABLED",
    group: "seeker",
    label: "Enable Seeker",
    type: "boolean",
    default: false,
  },
  {
    key: "SEEKER_SERVER",
    group: "seeker",
    label: "Seeker server URL",
    type: "url",
  },
  {
    key: "SEEKER_KEY",
    group: "seeker",
    label: "Seeker key",
    type: "secret",
  },

  /** Cron */
  {
    key: "CRON_ENABLED",
    group: "cron",
    label: "Enable background jobs",
    type: "boolean",
    default: true,
    warning: "Farmers stop running on schedule when this is off.",
  },
  {
    key: "CRON_MODE",
    group: "cron",
    label: "Job mode",
    type: "enum",
    default: "sequential",
    options: ["sequential", "concurrent"],
  },
  {
    key: "MINIMUM_FARMER_RATING",
    group: "cron",
    label: "Minimum farmer rating",
    type: "number",
    default: 0,
    min: 0,
    max: 5,
  },

  /** Advanced */
  {
    key: "DEFAULT_REFERRER_MODE",
    group: "advanced",
    label: "Default referrer mode",
    type: "enum",
    default: "single",
    options: ["single", "random"],
    help: "single uses the primary link, random spreads across members.",
  },
  {
    key: "MAX_CONCURRENT_ACCOUNTS",
    group: "advanced",
    label: "Max concurrent accounts",
    type: "number",
    default: 20,
    min: 1,
  },
  {
    key: "BAN_TRIGGER_COUNT",
    group: "advanced",
    label: "Errors before freezing a farmer",
    type: "number",
    default: 10,
    min: 1,
  },
  {
    key: "API_MAX_RETRY_COUNT",
    group: "advanced",
    label: "API retry count",
    type: "number",
    default: 10,
    min: 0,
  },
  {
    key: "API_RETRY_BASE_DELAY",
    group: "advanced",
    label: "API retry base delay (ms)",
    type: "number",
    default: 1000,
    min: 0,
  },
  {
    key: "ENABLE_UNPUBLISHED_FARMERS",
    group: "advanced",
    label: "Enable unpublished farmers",
    type: "boolean",
    default: false,
  },
];

/** Env prefix for a farmer */
export const getFarmerEnvPrefix = (id) =>
  "FARMER_" + id.replace(/-/g, "_").toUpperCase();

/** Per-farmer fields built from the farmer class defaults */
export function getFarmerFields(FarmerClass) {
  const prefix = getFarmerEnvPrefix(FarmerClass.id);
  const group = `farmer:${FarmerClass.id}`;

  return [
    {
      key: `${prefix}_ENABLED`,
      label: "Enabled",
      type: "boolean",
      default: FarmerClass.enabled,
    },
    {
      key: `${prefix}_AUTO_START`,
      label: "Auto-start new accounts",
      type: "boolean",
      default: FarmerClass.autoStart,
    },
    {
      key: `${prefix}_SKIP_EXECUTION_OF_NEW_ACCOUNT`,
      label: "Skip first run of new accounts",
      type: "boolean",
      default: FarmerClass.skipExecutionOfNewAccount,
    },
    {
      key: `${prefix}_LINK`,
      label: "Referral link",
      type: "url",
      default: FarmerClass.telegramLink,
      help: "Your own bot link with your referral code.",
    },
    {
      key: `${prefix}_PRIMARY_ACCOUNT_ID`,
      label: "Primary account ID",
      type: "telegramId",
      help: "Leave empty to use the general primary account.",
    },
    {
      key: `${prefix}_THREAD_ID`,
      label: "Topic ID",
      type: "threadId",
      help: "Leave empty to use the farming topic.",
    },
    {
      key: `${prefix}_INTERVAL`,
      label: "Schedule (cron)",
      type: "cron",
      default: FarmerClass.interval,
      help: "How often it runs, e.g. 0 * * * * for every hour.",
    },
    {
      key: `${prefix}_REFERRER_MODE`,
      label: "Referrer mode",
      type: "enum",
      options: ["single", "random"],
      help: "Leave empty to use the default referrer mode.",
    },
  ].map((field) => ({ ...field, group }));
}

/** Full schema for the loaded farmers */
export function getEnvSchema(farmers) {
  const farmerClasses = Object.values(farmers);

  return {
    groups: [
      ...ENV_GROUPS,
      ...farmerClasses.map((FarmerClass) => ({
        id: `farmer:${FarmerClass.id}`,
        title: `${FarmerClass.emoji || ""} ${FarmerClass.title}`.trim(),
        description: `Settings for the ${FarmerClass.title} farmer.`,
        farmer: FarmerClass.id,
      })),
    ],
    fields: [...ENV_FIELDS, ...farmerClasses.flatMap(getFarmerFields)],
  };
}

/** Check one value against its field, returning an error message or null */
export function validateField(field, value) {
  const text = value === null || value === undefined ? "" : String(value).trim();

  if (/[\r\n]/.test(String(value ?? ""))) {
    return "Must be a single line.";
  }

  if (text === "") {
    return field.required ? `${field.label} is required.` : null;
  }

  switch (field.type) {
    case "boolean":
      return /^(true|false)$/i.test(text) ? null : "Must be on or off.";

    case "number": {
      const number = Number(text);
      if (Number.isNaN(number)) return "Must be a number.";
      if (field.min !== undefined && number < field.min)
        return `Must be at least ${field.min}.`;
      if (field.max !== undefined && number > field.max)
        return `Must be at most ${field.max}.`;
      return null;
    }

    case "enum":
      return field.options.includes(text)
        ? null
        : `Must be one of: ${field.options.join(", ")}.`;

    case "telegramId":
      return /^\d+$/.test(text) ? null : "Must be a numeric Telegram ID.";

    case "chatId":
      return /^-100\d+$/.test(text)
        ? null
        : "Group chat IDs start with -100 followed by digits.";

    case "threadId":
      return /^\d+$/.test(text) ? null : "Topic IDs are numbers.";

    case "url":
      try {
        const url = new URL(text);
        return /^https?:$/.test(url.protocol) ? null : "Must start with https://";
      } catch {
        return "Must be a full link starting with https://";
      }

    case "cron":
      try {
        new Cron(text, { paused: true }).stop();
        return null;
      } catch {
        return "Not a valid cron schedule.";
      }

    case "secret":
      if (field.format === "botToken" && !/^\d+:[\w-]{30,}$/.test(text)) {
        return "Bot tokens look like 123456789:ABC-DEF...";
      }
      return null;

    default:
      return null;
  }
}
